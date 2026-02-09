// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {MessageDescriptor} from 'react-intl';

type Props = {
    featureName: string;
    title: MessageDescriptor;
    description: MessageDescriptor;
    learnMoreURL: string;
    svgImage?: React.ComponentType<{width?: number; height?: number}>;
};

// Matterspark: inline feature discovery upsell removed
const InlineSectionFeatureDiscovery: React.FC<Props> = () => {
    return null;
};

export default InlineSectionFeatureDiscovery;
