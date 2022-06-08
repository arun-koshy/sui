// Copyright (c) 2022, Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useState, useEffect, useContext } from 'react';

import { NetworkContext } from '../../context';
import { DefaultRpcClient as rpc } from '../../utils/api/DefaultRpcClient';
import { IS_STATIC_ENV } from '../../utils/envUtil';
import { findTxfromID } from '../../utils/static/searchUtil';
import ErrorResult from '../error-result/ErrorResult';
import Longtext from '../longtext/Longtext';

const DATATYPE_DEFAULT = {
    to: [],
    from: [],
    input: [],
    mutated: [],
    loadState: 'pending',
};

type categoryType = 'address' | 'object';

const getTx = async (id: string, network: string, category: categoryType) =>
    category === 'address'
        ? rpc(network).getTransactionsForAddress(id)
        : rpc(network).getTransactionsForObject(id);

const deduplicate = (results: string[][]) =>
    results
        .map((result) => result[1])
        .filter((value, index, self) => self.indexOf(value) === index);

function TxForAddressIDView({
    showData,
}: {
    showData: { to: string[][] | never[]; from: string[][] | never[] };
}) {
    if (!showData.from || !showData.to) return <></>;
    return (
        <>
            <div>
                <div>Transactions Sent</div>
                <div id="txFrom">
                    {deduplicate(showData.from).map((x, index) => (
                        <div key={`from-${index}`}>
                            <Longtext
                                text={x}
                                category="transactions"
                                isLink={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <div>Transactions Received</div>
                <div id="txTo">
                    {deduplicate(showData.to).map((x, index) => (
                        <div key={`to-${index}`}>
                            <Longtext
                                text={x}
                                category="transactions"
                                isLink={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

function TxForObjectIDView({
    showData,
}: {
    showData: { input: string[][] | never[]; mutated: string[][] | never[] };
}) {
    if (!showData.input || !showData.mutated) return <></>;
    return (
        <>
            <div>
                <div>Input</div>
                <div id="txInput">
                    {deduplicate(showData.input).map((x, index) => (
                        <div key={`from-${index}`}>
                            <Longtext
                                text={x}
                                category="transactions"
                                isLink={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <div>Mutated</div>
                <div id="txMutated">
                    {deduplicate(showData.mutated).map((x, index) => (
                        <div key={`to-${index}`}>
                            <Longtext
                                text={x}
                                category="transactions"
                                isLink={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
function TxForIDStatic({
    id,
    category,
}: {
    id: string;
    category: categoryType;
}) {
    const showData = findTxfromID(id);
    if (category === 'address' && showData?.to?.[0] && showData?.from?.[0]) {
        return <TxForAddressIDView showData={showData} />;
    }
    if (
        category === 'object' &&
        showData?.input?.[0] &&
        showData?.mutated?.[0]
    ) {
        return <TxForObjectIDView showData={showData} />;
    }
    return <></>;
}

function TxForIDAPI({ id, category }: { id: string; category: categoryType }) {
    const [showData, setData] = useState(DATATYPE_DEFAULT);
    const [network] = useContext(NetworkContext);
    useEffect(() => {
        getTx(id, network, category)
            .then((data) =>
                setData({
                    ...(data as typeof DATATYPE_DEFAULT),
                    loadState: 'loaded',
                })
            )
            .catch((error) => {
                console.log(error);
                setData({ ...DATATYPE_DEFAULT, loadState: 'fail' });
            });
    }, [id, network, category]);

    if (showData.loadState === 'pending') {
        return <div>Loading ...</div>;
    }

    if (showData.loadState === 'loaded') {
        if (category === 'address')
            return <TxForAddressIDView showData={showData} />;
        if (category === 'object')
            return <TxForObjectIDView showData={showData} />;
    }

    return (
        <ErrorResult
            id={id}
            errorMsg="Transactions could not be extracted on the following specified ID"
        />
    );
}

export default function TxForID({
    id,
    category,
}: {
    id: string;
    category: categoryType;
}) {
    return IS_STATIC_ENV ? (
        <TxForIDStatic id={id} category={category} />
    ) : (
        <TxForIDAPI id={id} category={category} />
    );
}
