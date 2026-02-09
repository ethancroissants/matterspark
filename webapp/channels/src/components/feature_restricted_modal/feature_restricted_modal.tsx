// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

type FeatureRestrictedModalProps = {
    titleAdminPreTrial: string;
    messageAdminPreTrial: string;
    titleAdminPostTrial?: string;
    messageAdminPostTrial?: string;
    titleEndUser?: string;
    messageEndUser?: string;
    customSecondaryButton?: { msg: string; action: () => void };
    feature?: string;
    minimumPlanRequiredForFeature?: string;
}

// Matterspark: feature restriction modal removed
const FeatureRestrictedModal = (_props: FeatureRestrictedModalProps) => {
    return null;
};

export default FeatureRestrictedModal;
