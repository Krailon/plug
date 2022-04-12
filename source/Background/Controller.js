import qs from "query-string";
import extension from "extensionizer";
import PlugController from "@psychedelic/plug-controller";
import { BackgroundController } from "@fleekhq/browser-rpc";

import { CONNECTION_STATUS } from "@shared/constants/connectionStatus";
import { E8S_PER_ICP, CYCLES_PER_TC } from "@shared/constants/currencies";
import { ICP_CANISTER_ID } from "@shared/constants/canisters";
import { validatePrincipalId } from "@shared/utils/ids";
import { areAllElementsIn } from "@shared/utils/array";
import { XTC_FEE } from "@shared/constants/addresses";
import { getApps, setApps, ConnectionModule, getProtectedIds } from "@modules";

import NotificationManager from "../lib/NotificationManager";
import SIZES from "../Pages/Notification/components/Transfer/constants";
import {
  getKeyringHandler,
  HANDLER_TYPES,
  getKeyringErrorMessage,
} from "./Keyring";
import {
  validateTransferArgs,
  validateBurnArgs,
  validateTransactions,
} from "./utils";
import ERRORS, { SILENT_ERRORS } from "./errors";

const DEFAULT_CURRENCY_MAP = {
  ICP: 0,
  XTC: 1,
};

let keyring = {};

const backgroundController = new BackgroundController({
  name: "bg-script",
  trustedSources: ["plug-content-script", "notification-port"],
});

const notificationManager = new NotificationManager(
  extension.extension.getURL("../assets/icons/plug.svg")
);

backgroundController.start();

const displayPopUp = ({
  callId,
  portId,
  argsJson,
  metadataJson,
  type,
  screenArgs: { height, top, left },
}) => {
  const url = qs.stringifyUrl({
    url: "notification.html",
    query: {
      callId,
      portId,
      type,
      argsJson,
      metadataJson,
    },
  });

  const height = height
    ? height
    : keyring?.isUnlocked
    ? SIZES.detailHeightSmall
    : SIZES.loginHeight;

  extension.windows.create({
    url,
    type: "popup",
    width: SIZES.width,
    height,
    top,
    left,
  });
};

const fetchCanistersInfo = async (whitelist) => {
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
      })
    );

    const sortedCanistersInfo = canistersInfo.sort((a, b) => {
      if (a.name && !b.name) return -1;
      return 1;
    });

    return sortedCanistersInfo;
  }

  return [];
};

export const init = async () => {
  keyring = new PlugController.PlugKeyRing();
  await keyring.init();
  if (keyring.isUnlocked) {
    const state = await keyring?.getState();
    if (!state?.wallets?.length > 0) {
      await keyring.lock();
    }
  }
};

// keyring handlers
extension.runtime.onMessage.addListener((message, _, sendResponse) => {
  const handleOnMessage = () => {
    const { params, type } = message;
    const keyringHandler = getKeyringHandler(type, keyring);
    if (!keyringHandler) return;

    keyringHandler(params)
      .then((res) => sendResponse(res))
      .catch((e) => {
        const keyringErrorMessage = getKeyringErrorMessage(type);
        const errorMessage = keyringErrorMessage
          ? `Unexpected error while ${keyringErrorMessage}`
          : "Unexpected error";
        console.warn(errorMessage);
        console.warn(e);
      });
  };

  if (!keyring) {
    init().then(() => {
      handleOnMessage();
    });
  } else {
    handleOnMessage();
  }

  // Usually we would not return, but it seems firefox needs us to
  return true; // eslint-disable-line
});

const isInitialized = async () => {
  await keyring?.init();
  const getLocks = getKeyringHandler(HANDLER_TYPES.GET_LOCKS, keyring);

  if (!getLocks) return false;

  const locks = await getLocks();

  return locks?.isInitialized;
};

const secureController = async (callback, controller) => {
  const initialized = await isInitialized();
  if (!initialized) {
    extension.tabs.create({
      url: "options.html",
    });
    callback(ERRORS.INITIALIZED_ERROR, null);
    return;
  }

  try {
    await controller();
  } catch (e) {
    notificationManager.notificateError(e.message);
  }
};

let connectionModule;
init().then(() => {
  // Exposing module methods
  connectionModule = new ConnectionModule(
    backgroundController,
    secureController,
    keyring
  );
  connectionModule.exposeMethods();
});

const requestBalance = async (accountId, callback) => {
  const getBalance = getKeyringHandler(HANDLER_TYPES.GET_BALANCE, keyring);
  const icpBalance = await getBalance(accountId);
  if (icpBalance.error) {
    callback(ERRORS.SERVER_ERROR(icpBalance.error), null);
  } else {
    callback(null, icpBalance);
  }
};

backgroundController.exposeController(
  "requestBalance",
  async (opts, metadata, accountId) =>
    secureController(opts.callback, async () => {
      const { callback, message, sender } = opts;

      getApps(keyring.currentWalletId.toString(), (apps = {}) => {
        const app = apps?.[metadata.url] || {};
        if (app?.status === CONNECTION_STATUS.accepted) {
          if (accountId && Number.isNaN(parseInt(accountId, 10))) {
            callback(ERRORS.CLIENT_ERROR("Invalid account id"), null);
          } else if (!keyring.isUnlocked) {
            displayPopUp({
              callId: message.data.data.id,
              portId: sender.id,
              type: "requestBalance",
              argsJson: accountId,
              metadataJson: JSON.stringify(metadata),
            });
          } else {
            requestBalance(accountId, callback);
          }
        } else {
          callback(ERRORS.CONNECTION_ERROR, null);
        }
      });
    })
);

backgroundController.exposeController(
  "handleRequestBalance",
  async (opts, url, subaccount, callId, portId) => {
    const { callback } = opts;

    getApps(keyring.currentWalletId.toString(), async (apps = {}) => {
      const app = apps?.[url] || {};
      callback(null, true);

      if (app?.status === CONNECTION_STATUS.accepted) {
        const getBalance = getKeyringHandler(
          HANDLER_TYPES.GET_BALANCE,
          keyring
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
  }
);

backgroundController.exposeController(
  "requestTransfer",
  async (opts, metadata, args) =>
    secureController(opts.callback, async () => {
      const { message, sender, callback } = opts;

      const { id: callId } = message.data.data;
      const { id: portId } = sender;

      getApps(keyring.currentWalletId.toString(), (apps = {}) => {
        const app = apps?.[metadata?.url] || {};

        if (app?.status === CONNECTION_STATUS.accepted) {
          const argsError = validateTransferArgs(args);
          if (argsError) {
            callback(argsError, null);
            return;
          }
          displayPopUp({
            callId,
            portId,
            type: "transfer",
            argsJson: JSON.stringify({ ...args, timeout: app?.timeout }),
            metadataJson: JSON.stringify(metadata),
          });
        } else {
          callback(ERRORS.CONNECTION_ERROR, null);
        }
      });
    })
);

backgroundController.exposeController(
  "handleRequestTransfer",
  async (opts, transferRequests, callId, portId) => {
    const { callback } = opts;
    const transfer = transferRequests?.[0];
    if (transfer?.status === "declined") {
      callback(null, true);
      callback(ERRORS.TRANSACTION_REJECTED, null, [{ portId, callId }]);
    } else {
      const getBalance = getKeyringHandler(HANDLER_TYPES.GET_BALANCE, keyring);
      const sendToken = getKeyringHandler(HANDLER_TYPES.SEND_TOKEN, keyring);
      const assets = await getBalance();
      const parsedAmount = transfer.amount / E8S_PER_ICP;
      if (assets?.[DEFAULT_CURRENCY_MAP.ICP]?.amount > parsedAmount) {
        const response = await sendToken({
          ...transfer,
          amount: parsedAmount,
          canisterId: ICP_CANISTER_ID,
        });

        if (response.error) {
          callback(null, false);
          callback(ERRORS.SERVER_ERROR(response.error), null, [
            { portId, callId },
          ]);
        } else {
          callback(null, true);
          callback(null, response, [{ portId, callId }]);
        }
      } else {
        callback(null, false);
        callback(ERRORS.BALANCE_ERROR, null, [{ portId, callId }]);
      }
    }
  }
);

const signData = async (payload, callback) => {
  const parsedPayload = new Uint8Array(Object.values(payload));
  const signed = await keyring.sign(parsedPayload.buffer);
  callback(null, [...new Uint8Array(signed)]);
};

backgroundController.exposeController(
  "requestSign",
  async (opts, payload, metadata, requestInfo) => {
    const { message, sender, callback } = opts;
    const { id: callId } = message.data.data;
    const { id: portId } = sender;
    const { canisterId, requestType, preApprove } = requestInfo;

    try {
      const isDangerousUpdateCall = !preApprove && requestType === "call";
      if (isDangerousUpdateCall) {
        getApps(keyring.currentWalletId.toString(), async (apps = {}) => {
          const app = apps?.[metadata.url] || {};
          if (app.status !== CONNECTION_STATUS.accepted) {
            callback(ERRORS.CONNECTION_ERROR, null);
            return;
          }
          if (canisterId && !(canisterId in app.whitelist)) {
            callback(ERRORS.CANISTER_NOT_WHITLESTED_ERROR(canisterId), null);
            return;
          }
          getProtectedIds(async (protectedIds) => {
            const canisterInfo = app.whitelist[canisterId];
            const shouldShowModal = protectedIds.includes(canisterInfo.id);

            if (shouldShowModal) {
              displayPopUp({
                callId,
                portId,
                type: "sign",
                argsJson: JSON.stringify({
                  requestInfo,
                  payload,
                  canisterInfo,
                  timeout: app?.timeout,
                }),
                metadataJson: JSON.stringify(metadata),
              });
            } else {
              signData(payload, callback);
            }
          });
        });
      } else {
        signData(payload, callback);
      }
    } catch (e) {
      callback(ERRORS.SERVER_ERROR(e), null);
    }
  }
);

backgroundController.exposeController(
  "handleSign",
  async (opts, status, payload, callId, portId) => {
    const { callback } = opts;

    if (status === CONNECTION_STATUS.accepted) {
      try {
        const parsedPayload = new Uint8Array(Object.values(payload));

        const signed = await keyring.sign(parsedPayload.buffer);
        callback(null, new Uint8Array(signed), [{ callId, portId }]);
        callback(null, true);
      } catch (e) {
        callback(ERRORS.SERVER_ERROR(e), null, [{ portId, callId }]);
        callback(null, false);
      }
    } else {
      callback(ERRORS.SIGN_REJECTED, null, [{ portId, callId }]);
      callback(null, true); // Return true to close the modal
    }
  }
);

backgroundController.exposeController("getPublicKey", async (opts) => {
  const { callback } = opts;
  try {
    const publicKey = await keyring.getPublicKey();
    callback(null, publicKey);
  } catch (e) {
    callback(ERRORS.SERVER_ERROR(e), null);
  }
});

backgroundController.exposeController(
  "verifyWhitelist",
  async (opts, metadata, whitelist) =>
    secureController(opts.callback, async () => {
      const { message, sender, callback } = opts;

      const { id: callId } = message.data.data;
      const { id: portId } = sender;

      let canistersInfo = [];

      const isValidWhitelist = Array.isArray(whitelist) && whitelist.length;

      if (isValidWhitelist) {
        canistersInfo = await fetchCanistersInfo(whitelist);
      }
      if (!whitelist.every((canisterId) => validatePrincipalId(canisterId))) {
        callback(ERRORS.CANISTER_ID_ERROR, null);
        return;
      }

      getApps(keyring.currentWalletId.toString(), async (apps = {}) => {
        const app = apps?.[metadata.url] || {};
        if (app?.status === CONNECTION_STATUS.accepted) {
          const allWhitelisted = areAllElementsIn(
            whitelist,
            app?.whitelist ? Object.keys(app?.whitelist) : []
          );

          if (allWhitelisted) {
            if (!keyring.isUnlocked) {
              displayPopUp({
                callId,
                portId,
                type: "allowAgent",
                argsJson: JSON.stringify({
                  whitelist,
                  canistersInfo,
                  updateWhitelist: true,
                  showList: false,
                  timeout: app?.timeout,
                }),
                metadataJson: JSON.stringify(metadata),
              });
            }
            const publicKey = await keyring.getPublicKey();
            callback(null, publicKey);
          } else {
            displayPopUp({
              callId,
              portId,
              type: "allowAgent",
              argsJson: JSON.stringify({
                whitelist,
                canistersInfo,
                updateWhitelist: true,
                showList: true,
              }),
              metadataJson: JSON.stringify(metadata),
              screenArgs: { top: 65, left: metadata.pageWidth - SIZES.width },
            });
          }
        } else {
          callback(ERRORS.CONNECTION_ERROR, null);
        }
      });
    })
);

backgroundController.exposeController(
  "handleAllowAgent",
  async (opts, url, response, callId, portId) => {
    const { callback } = opts;

    getApps(keyring.currentWalletId.toString(), async (apps = {}) => {
      const status =
        response.status === CONNECTION_STATUS.rejectedAgent
          ? CONNECTION_STATUS.accepted
          : response.status;
      const whitelist =
        response.status === CONNECTION_STATUS.accepted
          ? response.whitelist
          : [];

      const date = new Date().toISOString();

      const newApps = {
        ...apps,
        [url]: {
          ...apps[url],
          status: status || CONNECTION_STATUS.rejected,
          date,
          whitelist,
          events: [
            ...(apps[url]?.events || []),
            {
              status: status || CONNECTION_STATUS.rejected,
              date,
            },
          ],
        },
      };
      setApps(keyring.currentWalletId.toString(), newApps);
    });

    if (response?.status === CONNECTION_STATUS.accepted) {
      try {
        const publicKey = await keyring.getPublicKey();
        callback(null, publicKey, [{ portId, callId }]);
        callback(null, true);
      } catch (e) {
        callback(ERRORS.SERVER_ERROR(e), null, [{ portId, callId }]);
        callback(null, false);
      }
    } else {
      callback(ERRORS.AGENT_REJECTED, null, [{ portId, callId }]);
      callback(null, true); // Return true to close the modal
    }
  }
);

backgroundController.exposeController(
  "batchTransactions",
  async (opts, metadata, transactions) =>
    secureController(opts.callback, async () => {
      const { message, sender, callback } = opts;

      const { id: callId } = message.data.data;
      const { id: portId } = sender;

      getApps(keyring.currentWalletId.toString(), async (apps = {}) => {
        const app = apps?.[metadata?.url] || {};

        if (app?.status === CONNECTION_STATUS.accepted) {
          const transactionsError = validateTransactions(transactions);

          if (transactionsError) {
            callback(transactionsError, null);
            return;
          }
          const canistersInfo = app?.whitelist || {};
          const transactionsWithInfo = transactions.map((tx) => ({
            ...tx,
            canisterInfo: canistersInfo[tx.canisterId],
          }));

          displayPopUp({
            callId,
            portId,
            type: "batchTransactions",
            argsJson: JSON.stringify({
              transactions: transactionsWithInfo,
              canistersInfo,
              timeout: app?.timeout,
            }),
            metadataJson: JSON.stringify(metadata),
            screenArgs: { top: 65, left: metadata.pageWidth - SIZES.width },
          });
        } else {
          callback(ERRORS.CONNECTION_ERROR, null);
        }
      });
    })
);

backgroundController.exposeController(
  "handleBatchTransactions",
  async (opts, accepted, callId, portId) => {
    const { callback } = opts;
    callback(null, true); // close the modal
    if (accepted) {
      callback(null, accepted, [{ callId, portId }]);
    } else {
      callback(ERRORS.TRANSACTION_REJECTED, false, [{ callId, portId }]);
    }
  }
);

backgroundController.exposeController(
  "requestBurnXTC",
  async (opts, metadata, args) =>
    secureController(opts.callback, async () => {
      const { message, sender, callback } = opts;

      const { id: callId } = message.data.data;
      const { id: portId } = sender;

      getApps(keyring.currentWalletId.toString(), async (apps = {}) => {
        const app = apps?.[metadata.url] || {};
        if (app?.status === CONNECTION_STATUS.accepted) {
          const argsError = validateBurnArgs(args);
          if (argsError) {
            callback(argsError, null);
            return;
          }
          displayPopUp({
            callId,
            portId,
            type: "burnXTC",
            argsJson: JSON.stringify({ ...args, timeout: app?.timeout }),
            metadataJson: JSON.stringify(metadata),
          });
        } else {
          callback(ERRORS.CONNECTION_ERROR, null);
        }
      });
    })
);

backgroundController.exposeController(
  "handleRequestBurnXTC",
  async (opts, transferRequests, callId, portId) => {
    const { callback } = opts;
    const transfer = transferRequests?.[0];

    // Answer this callback no matter if the transfer succeeds or not.
    if (transfer?.status === "declined") {
      callback(null, true);
      callback(ERRORS.TRANSACTION_REJECTED, null, [{ portId, callId }]);
    } else {
      const burnXTC = getKeyringHandler(HANDLER_TYPES.BURN_XTC, keyring);
      const getBalance = getKeyringHandler(HANDLER_TYPES.GET_BALANCE, keyring);
      const assets = await getBalance();
      const xtcAmount =
        assets?.[DEFAULT_CURRENCY_MAP.XTC]?.amount * CYCLES_PER_TC;
      const parsedAmount = transfer.amount / CYCLES_PER_TC;
      if (xtcAmount - XTC_FEE > transfer.amount) {
        const response = await burnXTC({
          ...transfer,
          amount: parsedAmount,
        });
        if (response.error) {
          callback(null, false);
          callback(ERRORS.SERVER_ERROR(response.error), null, [
            { portId, callId },
          ]);
        } else {
          const transactionId = response?.Ok;

          callback(null, true);
          callback(null, transactionId, [{ portId, callId }]);
        }
      } else {
        callback(null, false);
        callback(ERRORS.BALANCE_ERROR, null, [{ portId, callId }]);
      }
    }
  }
);

backgroundController.exposeController("getPrincipal", async (opts, pageUrl) =>
  secureController(opts.callback, async () => {
    const { callback, message, sender } = opts;

    getApps(keyring.currentWalletId.toString(), async (apps = {}) => {
      const app = apps?.[pageUrl] || {};
      if (app?.status === CONNECTION_STATUS.accepted) {
        if (!keyring.isUnlocked) {
          displayPopUp({
            callId,
            portId,
            type: "principal",
            metadataJson: JSON.stringify({ url: pageUrl }),
          });
        } else {
          callback(
            null,
            keyring.state.wallets[keyring.currentWalletId].principal
          );
        }
      } else {
        callback(ERRORS.CONNECTION_ERROR, null);
      }
    });
  })
);

backgroundController.exposeController(
  "handleGetPrincipal",
  async (opts, url, callId, portId) => {
    const { callback } = opts;

    getApps(keyring.currentWalletId.toString(), async (apps = {}) => {
      const app = apps?.[url] || {};
      callback(null, true);
      if (app?.status === CONNECTION_STATUS.accepted) {
        const { principal } =
          keyring?.state?.wallets?.[keyring?.currentWalletId] || {};
        callback(null, principal?.toText(), [{ portId, callId }]);
      } else {
        callback(ERRORS.CONNECTION_ERROR, null, [{ portId, callId }]);
      }
    });
  }
);

backgroundController.exposeController(
  "handleError",
  async (opts, metadata, errorMessage) => {
    const { message, sender, callback } = opts;
    const { id: callId } = message.data.data;
    const { id: portId } = sender;

    if (
      !Object.values(SILENT_ERRORS)
        .map((e) => e.message)
        .includes(errorMessage)
    ) {
      notificationManager.notificateError(errorMessage);
    }

    callback(ERRORS.CLIENT_ERROR(errorMessage), null, [{ portId, callId }]);
    callback(null, true);
  }
);

backgroundController.exposeController(
  "handleTimeout",
  async (opts, metadata, errorMessage) => {
    const { message, sender, callback } = opts;
    const { id: callId } = message.data.data;
    const { id: portId } = sender;

    notificationManager.notificateTimeout(errorMessage);

    callback(ERRORS.CLIENT_ERROR(errorMessage), null, [{ portId, callId }]);
    callback(null, true);
  }
);

export default backgroundController;
