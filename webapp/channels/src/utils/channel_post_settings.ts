// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {Channel} from '@mattermost/types/channels';
import type {Post} from '@mattermost/types/posts';

// isThreadLocked reports whether a single thread has been locked via /lockthread.
export function isThreadLocked(rootPost?: Post | null): boolean {
    const value = rootPost?.props?.locked_thread;
    return value === true || value === 'true';
}

// areChannelThreadsLocked reports whether the channel has "lock all threads" enabled.
export function areChannelThreadsLocked(channel?: Channel | null): boolean {
    return Boolean(channel?.post_settings?.lock_all_threads);
}

// isRootPostingRestricted reports whether root-post creation is restricted in the channel.
export function isRootPostingRestricted(channel?: Channel | null): boolean {
    return Boolean(channel?.post_settings?.restrict_root_posts);
}

// canUserPostRoot mirrors the server-side check in ChannelPostSettings.IsUserAllowedToPostRoot.
// Channel/team/system admins (isAdmin) always bypass the restriction.
export function canUserPostRoot(channel: Channel | undefined | null, currentUserId: string, roles: string[], isAdmin: boolean): boolean {
    const settings = channel?.post_settings;
    if (!settings || !settings.restrict_root_posts) {
        return true;
    }
    if (isAdmin) {
        return true;
    }
    if (settings.allowed_root_post_user_ids?.includes(currentUserId)) {
        return true;
    }
    if (settings.allowed_root_post_roles?.some((role) => roles.includes(role))) {
        return true;
    }
    return false;
}

// canUserReplyInThread reports whether a user may reply in a thread, accounting for the channel-wide
// "lock all threads" toggle and per-thread locking. Admins always bypass.
export function canUserReplyInThread(channel: Channel | undefined | null, rootPost: Post | undefined | null, isAdmin: boolean): boolean {
    if (isAdmin) {
        return true;
    }
    return !areChannelThreadsLocked(channel) && !isThreadLocked(rootPost);
}
