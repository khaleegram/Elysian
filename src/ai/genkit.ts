import {genkit, configureGenkit} from 'genkit';
import {googleAI} from 'genkit/plugins/googleai';
import {firebase} from 'genkit/plugins/firebase';

configureGenkit({
    plugins: [
        googleAI(),
        firebase(),
    ],
    logLevel: 'debug',
    enableTracingAndMetrics: true,
});

export const ai = genkit;
