import qs from 'query-string';
import extension from 'extensionizer';
import ERRORS from '@background/errors';
import PlugController from '@psychedelic/plug-controller';
import { validatePrincipalId } from '@shared/utils/ids';
import { CONNECTION_STATUS } from '@shared/constants/connectionStatus';
import {
  getApps,
  setApps,
  getApp,
  removeApp
} from '../storageManager';
import SIZES from '../../Pages/Notification/components/Transfer/constants';

export class ConnectionModule {
  constructor(backgroundController, secureController, keyring) {
    this.keyring = keyring;
    this.secureController = secureController;
    this.backgroundController = backgroundController;
  }

  // Utils
  #getHandlerObjects() {
    return [
      this.#getConnectionData(),
      this.#handleConnectionData(),
      this.#disconnect(),
      this.#requestConnect(),
    ];
  }

  #secureWrapper({ args, handlerObject }) {
    return this.secureController(
      args[0].callback,
      async () => {
        handlerObject.handler(...args);
      }
    );
  }

  async #fetchCanistersInfo(whitelist) {
    if (whitelist && whitelist.length > 0) {
      const canistersInfo = await Promise.all(
        whitelist.map(async (id) => {
          let canisterInfo = { id };

          try {
            const fetchedCanisterInfo = await PlugController.getCanisterInfo(id);
            canisterInfo = { id, ...fetchedCanisterInfo };
          } catch (error) {
            /* eslint-disable-next-line */
            console.error(error);
          }

          return canisterInfo;
        }),
      );

      const sortedCanistersInfo = canistersInfo.sort((a, b) => {
        if (a.name && !b.name) return -1;
        return 1;
      });

      return sortedCanistersInfo;
    }

    return [];
  }

  // Handlers
  #getConnectionData() {
    return {
      methodName: 'getConnectionData',
      handler: async (opts, url) => {
        const { message, sender, callback } = opts;
        const { id: callId } = message.data.data;
        const { id: portId } = sender;

        getApp(this.keyring?.currentWalletId?.toString(), url, async (apps = {}) => {
          const app = apps?.[url] || {};
          if (app?.status === CONNECTION_STATUS.accepted) {
            if (!this.keyring?.isUnlocked) {
              const modalUrl = qs.stringifyUrl({
                url: 'notification.html',
                query: {
                  callId,
                  portId,
                  type: 'requestConnectionData',
                  argsJson: '{}',
                  metadataJson: JSON.stringify({ url }),
                },
              });

              extension.windows.create({
                url: modalUrl,
                type: 'popup',
                width: SIZES.width,
                height: SIZES.loginHeight,
              });
            } else {
              await this.keyring?.getState();
              const publicKey = await this.keyring?.getPublicKey();
              const { host, timeout, whitelist } = app;
              callback(null, {
                host, whitelist: Object.keys(whitelist), timeout, publicKey,
              });
            }
          } else {
            callback(null, null);
          }
        });
      }
    };
  };

  #handleConnectionData() {
    return {
      methodName: 'handleRequestConnectionData',
      handler: async (opts, url, _, callId, portId) => {
        const { callback } = opts;

        getApp(this.keyring?.currentWalletId?.toString(), url, async (apps = {}) => {
          const app = apps?.[url] || {};
          callback(null, true);

          if (app?.status === CONNECTION_STATUS.accepted) {
            const publicKey = await this.keyring?.getPublicKey();
            const { host, timeout, whitelist } = app;
            callback(null, {
              host, whitelist: Object.keys(whitelist), timeout, publicKey,
            }, [{ portId, callId }]);
          } else {
            callback(ERRORS.CONNECTION_ERROR, null, [{ portId, callId }]);
          }
        });
      }
    };
  };

  #disconnect() {
    return {
      methodName: 'disconnect',
      handler: async (opts, url) => {
        removeApp(this.keyring?.currentWalletId?.toString(), url, (removed) => {
          if (!removed) {
            opts.callback(ERRORS.CONNECTION_ERROR, null);
          }
        });
      },
    };
  };

  #requestConnect() {
    return {
      methodName: 'requestConnect',
      handler: async (opts, metadata, whitelist, timeout) => {
        let canistersInfo = [];
        const isValidWhitelist = Array.isArray(whitelist) && whitelist.length;
        if (!whitelist.every((canisterId) => validatePrincipalId(canisterId))) {
          opts.callback(ERRORS.CANISTER_ID_ERROR, null);
          return;
        }
        const { message, sender } = opts;
        const { id: callId } = message.data.data;
        const { id: portId } = sender;
        const { url: domainUrl, name, icons } = metadata;

        if (isValidWhitelist) {
          canistersInfo = await this.#fetchCanistersInfo(whitelist);
        }

        const date = new Date().toISOString();

        getApps(this.keyring?.currentWalletId.toString(), (apps = {}) => {
          const newApps = {
            ...apps,
            [domainUrl]: {
              url: domainUrl,
              name,
              status: CONNECTION_STATUS.pending,
              icon: icons[0] || null,
              timeout,
              date,
              events: [
                ...apps[domainUrl]?.events || [],
              ],
              whitelist,
            },
          };
          setApps(this.keyring?.currentWalletId.toString(), newApps);
        });

        // if we receive a whitelist, we create agent
        if (isValidWhitelist) {
          const newMetadata = { ...metadata, requestConnect: true };

          const url = qs.stringifyUrl({
            url: 'notification.html',
            query: {
              callId,
              portId,
              metadataJson: JSON.stringify(newMetadata),
              argsJson: JSON.stringify({ whitelist, canistersInfo, timeout }),
              type: 'allowAgent',
            },
          });

          const height = this.keyring?.isUnlocked
            ? Math.min(422 + 37 * whitelist.length, 600)
            : SIZES.loginHeight;

          extension.windows.create({
            url,
            type: 'popup',
            width: SIZES.width,
            height,
            top: 65,
            left: metadata.pageWidth - SIZES.width,
          });

          return;
        } else {
          const url = qs.stringifyUrl({
            url: 'notification.html',
            query: {
              callId,
              portId,
              url: domainUrl,
              icon: icons[0] || null,
              argsJson: JSON.stringify({ timeout }),
              type: 'connect',
            },
          });

          const height = this.keyring?.isUnlocked
            ? SIZES.appConnectHeight
            : SIZES.loginHeight;

          extension.windows.create({
            url,
            type: 'popup',
            width: SIZES.width,
            height,
          });
        }
      },
    };
  }

  // Exposer
  exposeMethods() {
    this.#getHandlerObjects().forEach(handlerObject => {
      this.backgroundController.exposeController(
        handlerObject.methodName,
        async (...args) => this.#secureWrapper({ args, handlerObject })
      );
    });
  }
}
