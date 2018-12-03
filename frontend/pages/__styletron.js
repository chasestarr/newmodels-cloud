import { Client, Server } from 'styletron-engine-atomic';

export const isServer = typeof window === 'undefined';

const getHydrate = () => document.getElementsByClassName('_styletron_hydrate_');

export const styletron = isServer ? new Server() : new Client({ hydrate: getHydrate() });
