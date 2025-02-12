import ERRORS from '@background/errors';
import { CONNECTION_STATUS } from '@shared/constants/connectionStatus';
import { getKeyringHandler, HANDLER_TYPES } from '@background/Keyring';
import { getApps } from '../storageManager';
import { ControllerModuleBase } from './controllerBase';

export class InformationModule extends ControllerModuleBase {
  // Utils
  #getHandlerObjects() {
    return [
      this.#requestBalance(),
      this.#handleRequestBalance(),
      this.#getPublicKey(),
      this.#getPrincipal(),
      this.#handleGetPrincipal(),
      this.#getICNSInfo(),
      this.#handleGetICNSInfo(),
    ];
  }

  async #internalRequestBalance(accountId, callback) {
    const getBalance = getKeyringHandler(HANDLER_TYPES.GET_BALANCE, this.keyring);
    const icpBalance = await getBalance(accountId);
    if (icpBalance.error) {
      callback(ERRORS.SERVER_ERROR(icpBalance.error), null);
    } else {
      callback(null, icpBalance);
    }
  }

  // Methods
  #requestBalance() {
    return {
      methodName: 'requestBalance',
      handler: async (opts, metadata, subaccount) => {
        const { callback, message, sender } = opts;

        getApps(this.keyring?.currentWalletId.toString(), (apps = {}) => {
          const app = apps?.[metadata.url] || {};

          if (app?.status === CONNECTION_STATUS.accepted) {
            if (subaccount && Number.isNaN(parseInt(subaccount, 10))) {
              callback(ERRORS.CLIENT_ERROR('Invalid account id'), null);
            } else if (!this.keyring?.isUnlocked) {
              this.displayPopUp({
                callId: message.data.data.id,
                portId: sender.id,
                type: 'requestBalance',
                argsJson: JSON.stringify({ subaccount }),
                metadataJson: JSON.stringify(metadata),
              }, callback);
            } else {
              this.#internalRequestBalance(subaccount, callback);
            }
          } else {
            callback(ERRORS.CONNECTION_ERROR, null);
          }
        });
      },
    };
  }

  #handleRequestBalance() {
    return {
      methodName: 'handleRequestBalance',
      handler: async (opts, url, args, callId, portId) => {
        const { callback } = opts;
        const { subaccount } = args;
        getApps(this.keyring?.currentWalletId.toString(), async (apps = {}) => {
          const app = apps?.[url] || {};
          callback(null, true);

          if (app?.status === CONNECTION_STATUS.accepted) {
            const getBalance = getKeyringHandler(
              HANDLER_TYPES.GET_BALANCE,
              this.keyring,
            );
            const icpBalance = await getBalance(subaccount);

            if (icpBalance.error) {
              callback(ERRORS.SERVER_ERROR(icpBalance.error), null, [
                { portId, callId },
              ]);
            } else {
              callback(null, icpBalance, [{ portId, callId }]);
            }
          } else {
            callback(ERRORS.CONNECTION_ERROR, null, [{ portId, callId }]);
          }
        });
      },
    };
  }

  #getPublicKey() {
    return {
      methodName: 'getPublicKey',
      handler: async (opts) => {
        const { callback } = opts;
        try {
          const publicKey = await this.keyring?.getPublicKey();
          callback(null, publicKey);
        } catch (e) {
          callback(ERRORS.SERVER_ERROR(e), null);
        }
      },
    };
  }

  #getPrincipal() {
    return {
      methodName: 'getPrincipal',
      handler: async (opts, pageUrl) => {
        const { callback, message, sender } = opts;

        getApps(this.keyring?.currentWalletId.toString(), async (apps = {}) => {
          const app = apps?.[pageUrl] || {};

          if (app?.status === CONNECTION_STATUS.accepted) {
            if (!this.keyring?.isUnlocked) {
              this.displayPopUp({
                url: 'notification.html',
                callId: message.data.data.id,
                portId: sender.id,
                type: 'principal',
                metadataJson: JSON.stringify({ url: pageUrl }),
              }, callback);
            } else {
              callback(
                null,
                this.keyring?.state.wallets[this.keyring?.currentWalletId].principal,
              );
            }
          } else {
            callback(ERRORS.CONNECTION_ERROR, null);
          }
        });
      },
    };
  }

  #handleGetPrincipal() {
    return {
      methodName: 'handleGetPrincipal',
      handler: async (opts, url, callId, portId) => {
        const { callback } = opts;

        getApps(this.keyring?.currentWalletId.toString(), async (apps = {}) => {
          const app = apps?.[url] || {};
          callback(null, true);
          if (app?.status === CONNECTION_STATUS.accepted) {
            const { principal } = this.keyring?.state?.wallets?.
              [this.keyring?.currentWalletId] || {};
            callback(null, principal?.toText(), [{ portId, callId }]);
          } else {
            callback(ERRORS.CONNECTION_ERROR, null, [{ portId, callId }]);
          }
        });
      },
    };
  }

  #getICNSInfo() {
    return {
      methodName: 'getICNSInfo',
      handler: async (opts, metadata) => {
        const { callback, message, sender } = opts;

        getApps(this.keyring?.currentWalletId.toString(), async (apps = {}) => {
          const app = apps?.[metadata.url] || {};

          if (app?.status === CONNECTION_STATUS.accepted) {
            if (!this.keyring?.isUnlocked) {
              this.displayPopUp({
                callId: message.data.data.id,
                portId: sender.id,
                type: 'getICNSInfo',
                argsJson: JSON.stringify({}),
                metadataJson: JSON.stringify(metadata),
              }, callback);
            } else {
              try {
                const getICNSData = getKeyringHandler(HANDLER_TYPES.GET_ICNS_DATA, this.keyring);
                const icnsData = await getICNSData({ refresh: true });
                callback(null, icnsData);
              } catch (e) {
                callback(null, { names: [] });
              }
            }
          } else {
            callback(ERRORS.CONNECTION_ERROR, null);
          }
        });
      },
    };
  }

  #handleGetICNSInfo() {
    return {
      methodName: 'handleGetICNSInfo',
      handler: async (opts, url, _, callId, portId) => {
        const { callback } = opts;

        getApps(this.keyring?.currentWalletId.toString(), async (apps = {}) => {
          const app = apps?.[url] || {};
          callback(null, true);

          if (app?.status === CONNECTION_STATUS.accepted) {
            try {
              const getICNSData = getKeyringHandler(HANDLER_TYPES.GET_ICNS_DATA, this.keyring);
              const icnsData = await getICNSData({ refresh: true });
              callback(null, icnsData, [{ portId, callId }]);
            } catch (e) {
              callback(null, { names: [] }, [{ portId, callId }]);
            }
          } else {
            callback(ERRORS.CONNECTION_ERROR, null, [{ portId, callId }]);
          }
        });
      },
    };
  }

  // Exposer
  exposeMethods() {
    this.#getHandlerObjects().forEach((handlerObject) => {
      this.backgroundController.exposeController(
        handlerObject.methodName,
        async (...args) => this.secureWrapper({ args, handlerObject }),
      );
    });
  }
}

export default { InformationModule };
