// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';
import type {MessageDescriptor} from 'react-intl';

import type {AnalyticsState} from '@mattermost/types/admin';
import type {CloudCustomer} from '@mattermost/types/cloud';
import type {ClientLicense} from '@mattermost/types/config';

import type {LicenseSkus} from 'utils/constants';

import type {ModalData} from 'types/actions';

type Props = {
    featureName: string;
    minimumSKURequiredForFeature: LicenseSkus;
    title: MessageDescriptor;
    copy: MessageDescriptor;
    learnMoreURL: string;
    featureDiscoveryImage: JSX.Element;
    prevTrialLicense: ClientLicense;
    stats?: AnalyticsState;
    actions: {
        getPrevTrialLicense: () => void;
        getCloudSubscription: () => void;
        openModal: <P>(modalData: ModalData<P>) => void;
    };
    isEnterpriseReady: boolean;
    isCloud: boolean;
    isCloudTrial: boolean;
    hadPrevCloudTrial: boolean;
    isSubscriptionLoaded: boolean;
    isPaidSubscription: boolean;
    customer?: CloudCustomer;
    showSkuTag?: boolean;
}

// Matterspark: feature discovery upsell removed
export default class FeatureDiscovery extends React.PureComponent<Props> {
    render() {
        return null;
    }
}
