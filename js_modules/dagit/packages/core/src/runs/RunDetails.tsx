import {gql} from '@apollo/client';
import {
  Button,
  Colors,
  DialogBody,
  DialogFooter,
  Dialog,
  Group,
  HighlightedCodeBlock,
  Icon,
  MetadataTable,
  Tooltip,
  IconName,
} from '@dagster-io/ui';
import * as React from 'react';
import * as yaml from 'yaml';

import {AppContext} from '../app/AppContext';
import {useCopyToClipboard} from '../app/browser';
import {TimestampDisplay} from '../schedules/TimestampDisplay';
import {RunStatus} from '../types/globalTypes';

import {RunTags} from './RunTags';
import {TimeElapsed} from './TimeElapsed';
import {RunDetailsFragment} from './types/RunDetailsFragment';
import {RunFragment} from './types/RunFragment';

export const timingStringForStatus = (status?: RunStatus) => {
  switch (status) {
    case RunStatus.QUEUED:
      return 'Queued';
    case RunStatus.CANCELED:
      return 'Canceled';
    case RunStatus.CANCELING:
      return 'Canceling…';
    case RunStatus.FAILURE:
      return 'Failed';
    case RunStatus.NOT_STARTED:
      return 'Waiting to start…';
    case RunStatus.STARTED:
      return 'Started…';
    case RunStatus.STARTING:
      return 'Starting…';
    case RunStatus.SUCCESS:
      return 'Succeeded';
    default:
      return 'None';
  }
};

const LoadingOrValue: React.FC<{
  loading: boolean;
  children: () => React.ReactNode;
}> = ({loading, children}) =>
  loading ? <div style={{color: Colors.Gray400}}>Loading…</div> : <div>{children()}</div>;

const TIME_FORMAT = {showSeconds: true, showTimezone: false};

export const RunDetails: React.FC<{
  loading: boolean;
  run: RunDetailsFragment | undefined;
}> = ({loading, run}) => {
  return (
    <MetadataTable
      spacing={0}
      rows={[
        {
          key: 'Started',
          value: (
            <LoadingOrValue loading={loading}>
              {() => {
                if (run?.startTime) {
                  return <TimestampDisplay timestamp={run.startTime} timeFormat={TIME_FORMAT} />;
                }
                return (
                  <div style={{color: Colors.Gray400}}>{timingStringForStatus(run?.status)}</div>
                );
              }}
            </LoadingOrValue>
          ),
        },
        {
          key: 'Ended',
          value: (
            <LoadingOrValue loading={loading}>
              {() => {
                if (run?.endTime) {
                  return <TimestampDisplay timestamp={run.endTime} timeFormat={TIME_FORMAT} />;
                }
                return (
                  <div style={{color: Colors.Gray400}}>{timingStringForStatus(run?.status)}</div>
                );
              }}
            </LoadingOrValue>
          ),
        },
        {
          key: 'Duration',
          value: (
            <LoadingOrValue loading={loading}>
              {() => {
                if (run?.startTime) {
                  return <TimeElapsed startUnix={run.startTime} endUnix={run.endTime} />;
                }
                return (
                  <div style={{color: Colors.Gray400}}>{timingStringForStatus(run?.status)}</div>
                );
              }}
            </LoadingOrValue>
          ),
        },
      ]}
    />
  );
};

export const RunConfigDialog: React.FC<{run: RunFragment; isJob: boolean}> = ({run, isJob}) => {
  const [showDialog, setShowDialog] = React.useState(false);
  const [copyIcon, setCopyIcon] = React.useState<IconName>('copy_to_clipboard');
  const {rootServerURI} = React.useContext(AppContext);
  const runConfigYaml = yaml.stringify(run.runConfig) || '';
  const copy = useCopyToClipboard();

  const copyConfig = () => {
    copy(runConfigYaml);
    setCopyIcon('copy_to_clipboard_done');
    setTimeout(() => setCopyIcon('copy_to_clipboard'), 2000);
  };

  return (
    <div>
      <Group direction="row" spacing={8}>
        <Button icon={<Icon name="tag" />} onClick={() => setShowDialog(true)}>
          View tags and config
        </Button>
        <Tooltip content="Loadable in dagit-debug" position="bottom-right">
          <Button
            icon={<Icon name="download_for_offline" />}
            onClick={() => window.open(`${rootServerURI}/download_debug/${run.runId}`)}
          >
            Debug file
          </Button>
        </Tooltip>
      </Group>
      <Dialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        style={{width: '800px'}}
        title="Run configuration"
      >
        <DialogBody>
          <Group direction="column" spacing={20}>
            <Group direction="column" spacing={12}>
              <div style={{fontSize: '16px', fontWeight: 600}}>Tags</div>
              <div>
                <RunTags tags={run.tags} mode={isJob ? null : run.mode} />
              </div>
            </Group>
            <Group direction="column" spacing={12}>
              <div style={{fontSize: '16px', fontWeight: 600}}>Config</div>
              <HighlightedCodeBlock value={runConfigYaml} language="yaml" />
            </Group>
          </Group>
        </DialogBody>
        <DialogFooter>
          <Button icon={<Icon name={copyIcon} />} onClick={() => copyConfig()} intent="none">
            Copy config
          </Button>
          <Button onClick={() => setShowDialog(false)} intent="primary">
            OK
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};

export const RUN_DETAILS_FRAGMENT = gql`
  fragment RunDetailsFragment on Run {
    id
    startTime
    endTime
    status
  }
`;
