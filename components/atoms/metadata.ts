import {DEBUG_MODE} from '../../util/config';
import {fetchTokensInfo, TokenMetadata} from '@solendprotocol/solend-sdk';
import {atom} from 'jotai';
import {unqiueAssetsAtom} from './pools';
import {connectionAtom} from './settings';
import {TOKEN_METADATA} from './defaultMetadata';

export const metadataAtom = atom<TokenMetadata>(TOKEN_METADATA);

export const loadMetadataAtom = atom(
  get => {
    get(metadataAtom);
  },
  async (get, set) => {
    const mints = get(unqiueAssetsAtom);
    const connection = get(connectionAtom);

    if (mints.length) {
      const metadata = await fetchTokensInfo(mints, connection, DEBUG_MODE);
      set(metadataAtom, metadata);
    }
  },
);
