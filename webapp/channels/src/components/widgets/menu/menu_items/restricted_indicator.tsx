// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {ReactNode} from 'react';
import type {MessageDescriptor} from 'react-intl';

type Props = {
    useModal?: boolean;
    blocked?: boolean;
    feature?: string;
    minimumPlanRequiredForFeature?: string;
    tooltipTitle?: ReactNode;
    tooltipMessage?: ReactNode;
    tooltipMessageBlocked?: string | MessageDescriptor;
    titleAdminPreTrial?: ReactNode;
    messageAdminPreTrial?: ReactNode;
    titleAdminPostTrial?: ReactNode;
    messageAdminPostTrial?: ReactNode;
    titleEndUser?: ReactNode;
    messageEndUser?: ReactNode;
    ctaExtraContent?: ReactNode;
    clickCallback?: () => void;
    customSecondaryButtonInModal?: {msg: string; action: () => void};
}

// Matterspark: restricted indicator removed
const RestrictedIndicator = (_props: Props) => {
    return null;
};

export default RestrictedIndicator;
