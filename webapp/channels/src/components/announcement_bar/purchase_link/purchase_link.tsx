// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

export interface Props {
    buttonTextElement: JSX.Element;
    eventID?: string;
    className?: string;
}

// Matterspark: purchase link removed
const PurchaseLink: React.FC<Props> = (_props: Props) => {
    return null;
};

export default PurchaseLink;
