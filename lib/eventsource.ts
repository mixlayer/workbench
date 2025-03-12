import { createEventSource, type EventSourceClient } from 'eventsource-client';
import { OutputPart, RunState } from './utils';

// Sends an HTTP request to the mixlayer backend and
// returns an event source
export function appRequest(
  url: string,
  params: any,
  onOutput: (part: OutputPart) => void,
  onStateChange: (state: RunState) => void,
): EventSourceClient {
  onStateChange(RunState.Queued);

  const es = createEventSource({
    url,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },

    onDisconnect: () => {
      // don't try to reconnect
      es.close();
    },

    onScheduleReconnect: () => {
      es.close();
    },

    onMessage: ({ data }) => {
      try {
        const dataJson = JSON.parse(data);

        if (dataJson.text && dataJson.text != '') {
          onOutput({
            text: dataJson.text,
            hidden: dataJson.hidden || false,
            stream: dataJson.stream,
            type: 'text',
          });

          onStateChange(RunState.Generating);
        }

        if (dataJson.done) {
          onStateChange(RunState.Ready);
          es.close();
        }

        if (dataJson.error) {
          onOutput({
            message: dataJson.error,
            stream: dataJson.stream,
            type: 'error',
          });

          onStateChange(RunState.Error);

          es.close();
        }
      } catch (err: any) {
        onStateChange(RunState.Error);

        onOutput({
          message: err,
          stream: 'error',
          type: 'error',
        });
        console.error(err);

        es.close();
      }
    },
    body: JSON.stringify({
      stream: true,
      hidden: true,
      params,
    }),
  });

  return es;
}
