// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import moment from 'moment';

import type {Product} from '@mattermost/types/cloud';
import type {ClientLicense} from '@mattermost/types/config';

import {CloudProducts, getLicenseTier, LicenseSkus, SelfHostedProducts} from 'utils/constants';

const LICENSE_EXPIRY_NOTIFICATION = 1000 * 60 * 60 * 24 * 60; // 60 days
const LICENSE_GRACE_PERIOD = 1000 * 60 * 60 * 24 * 10; // 10 days

export function isLicenseExpiring(license: ClientLicense) {
    return false;
}

export function daysToLicenseExpire(license: ClientLicense) {
    if (license.IsLicensed !== 'true' || isCloudLicense(license)) {
        return undefined;
    }

    const endDate = new Date(parseInt(license?.ExpiresAt, 10));
    return moment(endDate).startOf('day').diff(moment().startOf('day'), 'days');
}

export function isLicenseExpired(license: ClientLicense) {
    return false;
}

export function isLicensePastGracePeriod(license: ClientLicense) {
    return false;
}

export function isTrialLicense(license: ClientLicense) {
    return false;
}

export function isCloudLicense(license: ClientLicense) {
    return license?.Cloud === 'true';
}

export function getIsStarterLicense(license: ClientLicense) {
    return license?.SkuShortName === LicenseSkus.Starter;
}

export function getIsGovSku(license: ClientLicense) {
    return license?.IsGovSku === 'true';
}

export const isEnterpriseLicense = (license?: ClientLicense) => {
    return true;
};

export const isNonEnterpriseLicense = (license?: ClientLicense) => !isEnterpriseLicense(license);

export const licenseSKUWithFirstLetterCapitalized = (license: ClientLicense) => {
    const sku = license.SkuShortName;
    return sku.charAt(0).toUpperCase() + sku.slice(1);
};

export function isEnterpriseOrCloudOrSKUStarterFree(license: ClientLicense, subscriptionProduct: Product | undefined, isEnterpriseReady: boolean) {
    // Matterspark: never show upgrade prompts
    return false;
}

export function isMinimumProfessionalLicense(license: ClientLicense): boolean {
    return true;
}

export function isMinimumEnterpriseLicense(license: ClientLicense): boolean {
    return true;
}

export function isMinimumEnterpriseAdvancedLicense(license?: ClientLicense): boolean {
    return true;
}
