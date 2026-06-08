// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {useCallback, useEffect, useState} from 'react';
import {useIntl} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';

import type {Channel, ChannelPostSettings} from '@mattermost/types/channels';
import type {ServerError} from '@mattermost/types/errors';

import {patchChannel} from 'mattermost-redux/actions/channels';
import {Client4} from 'mattermost-redux/client';
import {Permissions} from 'mattermost-redux/constants';
import {haveITeamPermission} from 'mattermost-redux/selectors/entities/roles';
import {getUser} from 'mattermost-redux/selectors/entities/users';

import ColorInput from 'components/color_input';
import type {TextboxElement} from 'components/textbox';
import Toggle from 'components/toggle';
import AdvancedTextbox from 'components/widgets/advanced_textbox/advanced_textbox';
import type {SaveChangesPanelState} from 'components/widgets/modals/components/save_changes_panel';
import SaveChangesPanel from 'components/widgets/modals/components/save_changes_panel';

import type {GlobalState} from 'types/store';

import './channel_settings_configuration_tab.scss';

const POST_SETTINGS_ROLE_OPTIONS = [
    {role: 'channel_admin', id: 'channel_settings.post_settings.role.channel_admin', defaultMessage: 'Channel Admins'},
    {role: 'channel_user', id: 'channel_settings.post_settings.role.channel_user', defaultMessage: 'All Members'},
];

const CHANNEL_BANNER_MAX_CHARACTER_LIMIT = 1024;
const CHANNEL_BANNER_MIN_CHARACTER_LIMIT = 0;

const DEFAULT_CHANNEL_BANNER = {
    enabled: false,
    background_color: '#DDDDDD',
    text: '',
};

type Props = {
    channel: Channel;
    setAreThereUnsavedChanges?: (unsaved: boolean) => void;
    showTabSwitchError?: boolean;
}

function ChannelSettingsConfigurationTab({channel, setAreThereUnsavedChanges, showTabSwitchError}: Props) {
    const {formatMessage} = useIntl();
    const dispatch = useDispatch();

    const heading = formatMessage({id: 'channel_banner.label.name', defaultMessage: 'Channel Banner'});
    const subHeading = formatMessage({id: 'channel_banner.label.subtext', defaultMessage: 'When enabled, a customized banner will display at the top of the channel.'});
    const bannerTextSettingTitle = formatMessage({id: 'channel_banner.banner_text.label', defaultMessage: 'Banner text'});
    const bannerColorSettingTitle = formatMessage({id: 'channel_banner.banner_color.label', defaultMessage: 'Banner color'});
    const bannerTextPlaceholder = formatMessage({id: 'channel_banner.banner_text.placeholder', defaultMessage: 'Channel banner text'});

    const initialBannerInfo = channel.banner_info || DEFAULT_CHANNEL_BANNER;

    // Post settings are editable only by team admins or higher.
    const canManagePostSettings = useSelector((state: GlobalState) => haveITeamPermission(state, channel.team_id, Permissions.MANAGE_TEAM));

    const initialPostSettings = channel.post_settings || {};
    const initialAllowedUserIds = initialPostSettings.allowed_root_post_user_ids || [];

    // Prefill the members input with usernames resolved from the store (falls back to the id).
    const initialAllowedMembers = useSelector((state: GlobalState) =>
        initialAllowedUserIds.map((id) => getUser(state, id)?.username || id).join(', '),
    );

    const [restrictRootPosts, setRestrictRootPosts] = useState(Boolean(initialPostSettings.restrict_root_posts));
    const [lockAllThreads, setLockAllThreads] = useState(Boolean(initialPostSettings.lock_all_threads));
    const [allowedRoles, setAllowedRoles] = useState<string[]>(initialPostSettings.allowed_root_post_roles || []);
    const [allowedMembersInput, setAllowedMembersInput] = useState(initialAllowedMembers);

    const [formError, setFormError] = useState('');
    const [showBannerTextPreview, setShowBannerTextPreview] = useState(false);
    const [updatedChannelBanner, setUpdatedChannelBanner] = useState(initialBannerInfo);

    const [requireConfirm, setRequireConfirm] = useState(false);
    const [characterLimitExceeded, setCharacterLimitExceeded] = useState(false);
    const [saveChangesPanelState, setSaveChangesPanelState] = useState<SaveChangesPanelState>();

    // Change handlers
    const handleToggle = useCallback(() => {
        const newValue = !updatedChannelBanner.enabled;
        const toUpdate = {
            ...updatedChannelBanner,
            enabled: newValue,
        };
        if (!newValue) {
            toUpdate.text = initialBannerInfo.text;
            toUpdate.background_color = initialBannerInfo.background_color;
        }

        setUpdatedChannelBanner(toUpdate);
    }, [initialBannerInfo, updatedChannelBanner]);

    const resetFormErrors = useCallback(() => {
        setFormError('');
        setSaveChangesPanelState(undefined);
    }, []);

    const handleTextChange = useCallback((e: React.ChangeEvent<TextboxElement>) => {
        const newValue = e.target.value;
        setUpdatedChannelBanner((prev) => ({
            ...prev,
            text: newValue,
        }));

        if (newValue.trim().length > CHANNEL_BANNER_MAX_CHARACTER_LIMIT) {
            setFormError(formatMessage({
                id: 'channel_settings.save_changes_panel.standard_error',
                defaultMessage: 'There are errors in the form above',
            }));
            setCharacterLimitExceeded(true);
        } else if (newValue.trim().length <= CHANNEL_BANNER_MIN_CHARACTER_LIMIT) {
            setFormError(formatMessage({
                id: 'channel_settings.save_changes_panel.banner_text.required_error',
                defaultMessage: 'Channel banner text cannot be empty when enabled',
            }));
            setCharacterLimitExceeded(true);
        } else {
            resetFormErrors();
            setCharacterLimitExceeded(false);
        }
    }, [formatMessage, resetFormErrors]);

    const handleColorChange = useCallback((color: string) => {
        setUpdatedChannelBanner((prev) => ({
            ...prev,
            background_color: color,
        }));

        if (color.trim()) {
            resetFormErrors();
        }
    }, [resetFormErrors]);

    const toggleTextPreview = useCallback(() => setShowBannerTextPreview((show) => !show), []);

    const handleToggleRestrictRootPosts = useCallback(() => {
        setRestrictRootPosts((prev) => !prev);
        resetFormErrors();
    }, [resetFormErrors]);

    const handleToggleLockAllThreads = useCallback(() => {
        setLockAllThreads((prev) => !prev);
        resetFormErrors();
    }, [resetFormErrors]);

    const handleToggleAllowedRole = useCallback((role: string) => {
        setAllowedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
        resetFormErrors();
    }, [resetFormErrors]);

    const handleAllowedMembersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setAllowedMembersInput(e.target.value);
        resetFormErrors();
    }, [resetFormErrors]);

    const postSettingsChanged = useCallback(() => {
        return restrictRootPosts !== Boolean(initialPostSettings.restrict_root_posts) ||
            lockAllThreads !== Boolean(initialPostSettings.lock_all_threads) ||
            allowedRoles.join(',') !== (initialPostSettings.allowed_root_post_roles || []).join(',') ||
            allowedMembersInput.trim() !== initialAllowedMembers.trim();
    }, [allowedMembersInput, allowedRoles, initialAllowedMembers, initialPostSettings, lockAllThreads, restrictRootPosts]);

    const hasUnsavedChanges = useCallback(() => {
        const bannerChanged = (updatedChannelBanner.text?.trim() || '') !== (initialBannerInfo?.text?.trim() || '') ||
            (updatedChannelBanner.background_color?.trim() || '') !== (initialBannerInfo?.background_color?.trim() || '') ||
            updatedChannelBanner.enabled !== initialBannerInfo?.enabled;
        return bannerChanged || (canManagePostSettings && postSettingsChanged());
    }, [canManagePostSettings, initialBannerInfo, postSettingsChanged, updatedChannelBanner]);

    useEffect(() => {
        const unsavedChanges = hasUnsavedChanges();
        setRequireConfirm(unsavedChanges);
        setAreThereUnsavedChanges?.(unsavedChanges);
    }, [hasUnsavedChanges, setAreThereUnsavedChanges]);

    const handleServerError = useCallback((err: ServerError) => {
        const errorMsg = err.message || formatMessage({id: 'channel_settings.unknown_error', defaultMessage: 'Something went wrong.'});
        setFormError(errorMsg);
    }, [formatMessage]);

    const handleSave = useCallback(async (): Promise<boolean> => {
        if (!channel) {
            return false;
        }

        if (updatedChannelBanner.enabled && !updatedChannelBanner.text?.trim()) {
            setFormError(formatMessage({
                id: 'channel_settings.error_banner_text_required',
                defaultMessage: 'Banner text is required',
            }));
            return false;
        }

        if (updatedChannelBanner.enabled && !updatedChannelBanner.background_color?.trim()) {
            setFormError(formatMessage({
                id: 'channel_settings.error_banner_color_required',
                defaultMessage: 'Banner color is required',
            }));
            return false;
        }

        const updated: Partial<Channel> = {};

        updated.banner_info = {
            text: updatedChannelBanner.text?.trim() || '',
            background_color: updatedChannelBanner.background_color?.trim() || '',
            enabled: updatedChannelBanner.enabled,
        };

        const {error} = await dispatch(patchChannel(channel.id, updated));
        if (error) {
            handleServerError(error as ServerError);
            return false;
        }

        if (canManagePostSettings && postSettingsChanged()) {
            try {
                let allowedUserIds: string[] = [];
                const usernames = allowedMembersInput.split(',').map((u) => u.trim().replace(/^@/, '')).filter(Boolean);
                if (usernames.length > 0) {
                    const profiles = await Client4.getProfilesByUsernames(usernames);
                    allowedUserIds = profiles.map((p) => p.id);
                }

                const settings: ChannelPostSettings = {
                    restrict_root_posts: restrictRootPosts,
                    lock_all_threads: lockAllThreads,
                    allowed_root_post_roles: allowedRoles,
                    allowed_root_post_user_ids: allowedUserIds,
                };

                await Client4.updateChannelPostSettings(channel.id, settings);
            } catch (err) {
                handleServerError(err as ServerError);
                return false;
            }
        }

        return true;
    }, [allowedMembersInput, allowedRoles, canManagePostSettings, channel, dispatch, formatMessage, handleServerError, lockAllThreads, postSettingsChanged, restrictRootPosts, updatedChannelBanner]);

    const handleSaveChanges = useCallback(async () => {
        const success = await handleSave();
        if (!success) {
            setSaveChangesPanelState('error');
            return;
        }

        // Update local state with trimmed values after successful save
        setUpdatedChannelBanner((prev) => ({
            ...prev,
            text: prev.text?.trim() || '',
            background_color: prev.background_color?.trim() || '',
        }));

        resetFormErrors();
        setSaveChangesPanelState('saved');
    }, [handleSave, resetFormErrors]);

    const handleCancel = useCallback(() => {
        setRequireConfirm(false);
        setSaveChangesPanelState(undefined);
        setShowBannerTextPreview(false);

        setUpdatedChannelBanner(initialBannerInfo);
        setRestrictRootPosts(Boolean(initialPostSettings.restrict_root_posts));
        setLockAllThreads(Boolean(initialPostSettings.lock_all_threads));
        setAllowedRoles(initialPostSettings.allowed_root_post_roles || []);
        setAllowedMembersInput(initialAllowedMembers);
        setFormError('');
        setSaveChangesPanelState(undefined);
        setCharacterLimitExceeded(false);
    }, [initialAllowedMembers, initialBannerInfo, initialPostSettings]);

    const handleClose = useCallback(() => {
        setSaveChangesPanelState(undefined);
        setRequireConfirm(false);
    }, []);

    const hasErrors = Boolean(formError) ||
        characterLimitExceeded ||
        showTabSwitchError;

    const showSaveChangesPanel = requireConfirm || saveChangesPanelState === 'saved';

    return (
        <div className='ChannelSettingsModal__configurationTab'>
            <div className='channel_banner_header'>
                <div className='channel_banner_header__text'>
                    <label
                        className='Input_legend'
                        aria-label={heading}
                    >
                        {heading}
                    </label>
                    <label
                        className='Input_subheading'
                        aria-label={heading}
                    >
                        {subHeading}
                    </label>
                </div>

                <div className='channel_banner_header__toggle'>
                    <Toggle
                        id='channelBannerToggle'
                        ariaLabel={heading}
                        size='btn-md'
                        disabled={false}
                        onToggle={handleToggle}
                        toggled={updatedChannelBanner.enabled}
                        tabIndex={0}
                        toggleClassName='btn-toggle-primary'
                    />
                </div>
            </div>

            {
                updatedChannelBanner.enabled &&
                <div className='channel_banner_section_body'>
                    {/*Banner text section*/}
                    <div className='setting_section'>
                        <span
                            className='setting_title'
                            aria-label={bannerTextSettingTitle}
                        >
                            {bannerTextSettingTitle}
                        </span>

                        <div className='setting_body'>
                            <AdvancedTextbox
                                id='channel_banner_banner_text_textbox'
                                value={updatedChannelBanner.text!}
                                channelId={channel.id}
                                onKeyPress={() => {}}
                                showCharacterCount={true}
                                useChannelMentions={false}
                                onChange={handleTextChange}
                                preview={showBannerTextPreview}
                                togglePreview={toggleTextPreview}
                                hasError={characterLimitExceeded}
                                createMessage={bannerTextPlaceholder}
                                maxLength={CHANNEL_BANNER_MAX_CHARACTER_LIMIT}
                                minLength={CHANNEL_BANNER_MIN_CHARACTER_LIMIT}
                            />
                        </div>
                    </div>

                    {/*Banner background color section*/}
                    <div className='setting_section'>
                        <span
                            className='setting_title'
                            aria-label={bannerColorSettingTitle}
                        >
                            {bannerColorSettingTitle}
                        </span>

                        <div className='setting_body'>
                            <ColorInput
                                id='channel_banner_banner_background_color_picker'
                                onChange={handleColorChange}
                                value={updatedChannelBanner.background_color || ''}
                            />
                        </div>
                    </div>
                </div>
            }

            {canManagePostSettings && (
                <div className='channel_post_settings_section'>
                    <div className='channel_banner_header'>
                        <div className='channel_banner_header__text'>
                            <label className='Input_legend'>
                                {formatMessage({id: 'channel_settings.post_settings.label', defaultMessage: 'Post Settings'})}
                            </label>
                            <label className='Input_subheading'>
                                {formatMessage({id: 'channel_settings.post_settings.subtext', defaultMessage: 'Control who can post in this channel and lock threads.'})}
                            </label>
                        </div>
                    </div>

                    <div className='channel_banner_header'>
                        <div className='channel_banner_header__text'>
                            <label className='Input_legend'>
                                {formatMessage({id: 'channel_settings.post_settings.restrict.label', defaultMessage: 'Restrict who can post'})}
                            </label>
                            <label className='Input_subheading'>
                                {formatMessage({id: 'channel_settings.post_settings.restrict.subtext', defaultMessage: 'Only the members and roles you choose can create new posts. Everyone else can still reply in threads.'})}
                            </label>
                        </div>
                        <div className='channel_banner_header__toggle'>
                            <Toggle
                                id='restrictRootPostsToggle'
                                size='btn-md'
                                disabled={false}
                                onToggle={handleToggleRestrictRootPosts}
                                toggled={restrictRootPosts}
                                tabIndex={0}
                                toggleClassName='btn-toggle-primary'
                            />
                        </div>
                    </div>

                    {restrictRootPosts && (
                        <div className='channel_post_settings_body'>
                            <div className='setting_section'>
                                <span className='setting_title'>
                                    {formatMessage({id: 'channel_settings.post_settings.members.label', defaultMessage: 'Allowed members'})}
                                </span>
                                <div className='setting_body'>
                                    <input
                                        id='allowedPostMembersInput'
                                        type='text'
                                        className='form-control'
                                        value={allowedMembersInput}
                                        onChange={handleAllowedMembersChange}
                                        placeholder={formatMessage({id: 'channel_settings.post_settings.members.placeholder', defaultMessage: 'Enter usernames separated by commas'})}
                                    />
                                </div>
                            </div>

                            <div className='setting_section'>
                                <span className='setting_title'>
                                    {formatMessage({id: 'channel_settings.post_settings.roles.label', defaultMessage: 'Allowed roles'})}
                                </span>
                                <div className='setting_body'>
                                    {POST_SETTINGS_ROLE_OPTIONS.map((option) => (
                                        <label
                                            key={option.role}
                                            className='post_settings_role_option'
                                        >
                                            <input
                                                type='checkbox'
                                                checked={allowedRoles.includes(option.role)}
                                                onChange={() => handleToggleAllowedRole(option.role)}
                                            />
                                            {formatMessage({id: option.id, defaultMessage: option.defaultMessage})}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className='channel_banner_header'>
                        <div className='channel_banner_header__text'>
                            <label className='Input_legend'>
                                {formatMessage({id: 'channel_settings.post_settings.lock_threads.label', defaultMessage: 'Lock all threads'})}
                            </label>
                            <label className='Input_subheading'>
                                {formatMessage({id: 'channel_settings.post_settings.lock_threads.subtext', defaultMessage: 'Prevent everyone except admins from replying in any thread in this channel.'})}
                            </label>
                        </div>
                        <div className='channel_banner_header__toggle'>
                            <Toggle
                                id='lockAllThreadsToggle'
                                size='btn-md'
                                disabled={false}
                                onToggle={handleToggleLockAllThreads}
                                toggled={lockAllThreads}
                                tabIndex={0}
                                toggleClassName='btn-toggle-primary'
                            />
                        </div>
                    </div>
                </div>
            )}

            {showSaveChangesPanel && (
                <SaveChangesPanel
                    handleSubmit={handleSaveChanges}
                    handleCancel={handleCancel}
                    handleClose={handleClose}
                    tabChangeError={hasErrors}
                    state={hasErrors ? 'error' : saveChangesPanelState}
                    customErrorMessage={formError}
                    cancelButtonText={formatMessage({
                        id: 'channel_settings.save_changes_panel.reset',
                        defaultMessage: 'Reset',
                    })}
                />
            )}
        </div>
    );
}

export default ChannelSettingsConfigurationTab;
