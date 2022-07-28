import { createContext, useContext } from "react";

import { produce } from "immer";
import create from "zustand";

import { IConnection, Protobuf, Types } from "@meshtastic/meshtasticjs";

export type Page =
  | "messages"
  | "map"
  | "extensions"
  | "config"
  | "channels"
  | "info";

export interface MessageWithAck {
  message: Types.TextPacket;
  ack: boolean;
  received: Date;
}

export interface Channel {
  config: Protobuf.Channel;
  lastInterraction: Date;
  messages: MessageWithAck[];
}

export interface Node {
  deviceMetrics: Protobuf.DeviceMetrics;
  environmentMetrics: Protobuf.EnvironmentMetrics;
  data: Protobuf.NodeInfo;
}

export interface Device {
  ready: boolean;
  status: Types.DeviceStatusEnum;
  channels: Channel[];
  config: Protobuf.LocalConfig;
  moduleConfig: Protobuf.LocalModuleConfig;
  hardware: Protobuf.MyNodeInfo;
  nodes: Node[];
  connection?: IConnection;
  activeChat: number;
  activePage: Page;

  setReady(ready: boolean): void;
  setStatus: (status: Types.DeviceStatusEnum) => void;
  addChannel: (channel: Channel) => void;
  setConfig: (config: Protobuf.Config) => void;
  setModuleConfig: (config: Protobuf.ModuleConfig) => void;
  setHardware: (hardware: Protobuf.MyNodeInfo) => void;
  setMetrics: (metrics: Types.TelemetryPacket) => void;
  setActiveChat: (chatIndex: number) => void;
  setActivePage: (page: Page) => void;
  addNodeInfo: (nodeInfo: Types.NodeInfoPacket) => void;
  addUser: (user: Types.UserPacket) => void;
  addPosition: (position: Types.PositionPacket) => void;
  addConnection: (connection: IConnection) => void;
  addMessage: (message: MessageWithAck) => void;
  ackMessage: (channelIndex: number, messageId: number) => void;
}

export interface DeviceState {
  devices: Map<number, Device>;
  remoteDevices: Map<number, undefined>;

  addDevice: (id: number) => Device;
  removeDevice: (id: number) => void;
  getDevices: () => Device[];
}

export const useDeviceStore = create<DeviceState>((set, get) => ({
  devices: new Map(),
  remoteDevices: new Map(),

  addDevice: (id: number) => {
    set(
      produce<DeviceState>((draft) => {
        draft.devices.set(id, {
          ready: false,
          status: Types.DeviceStatusEnum.DEVICE_DISCONNECTED,
          channels: [],
          config: Protobuf.LocalConfig.create(),
          moduleConfig: Protobuf.LocalModuleConfig.create(),
          hardware: Protobuf.MyNodeInfo.create(),
          nodes: [],
          connection: undefined,
          activeChat: 0,
          activePage: "messages",

          setReady: (ready: boolean) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.ready = ready;
                }
              })
            );
          },
          setStatus: (status: Types.DeviceStatusEnum) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.status = status;
                }
              })
            );
          },
          addChannel: (channel: Channel) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  const channelIndex = device.channels.findIndex(
                    (c) => c.config.index === channel.config.index
                  );
                  if (channelIndex !== -1) {
                    const messages = device.channels[channelIndex].messages;
                    device.channels[channelIndex] = channel;
                    device.channels[channelIndex].messages = messages;
                  } else {
                    device.channels.push(channel);
                  }
                }
              })
            );
          },
          setConfig: (config: Protobuf.Config) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);

                if (device) {
                  switch (config.payloadVariant.oneofKind) {
                    case "device":
                      device.config.device = config.payloadVariant.device;
                      break;
                    case "position":
                      device.config.position = config.payloadVariant.position;
                      break;
                    case "power":
                      device.config.power = config.payloadVariant.power;
                      break;
                    case "wifi":
                      device.config.wifi = config.payloadVariant.wifi;
                      break;
                    case "display":
                      device.config.display = config.payloadVariant.display;
                      break;
                    case "lora":
                      device.config.lora = config.payloadVariant.lora;
                      break;
                  }
                }
              })
            );
          },
          setModuleConfig: (config: Protobuf.ModuleConfig) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);

                if (device) {
                  switch (config.payloadVariant.oneofKind) {
                    case "mqtt":
                      device.moduleConfig.mqtt = config.payloadVariant.mqtt;
                      break;
                    case "serial":
                      device.moduleConfig.serial = config.payloadVariant.serial;
                      break;
                    case "externalNotification":
                      device.moduleConfig.externalNotification =
                        config.payloadVariant.externalNotification;
                      break;
                    case "storeForward":
                      device.moduleConfig.storeForward =
                        config.payloadVariant.storeForward;
                      break;
                    case "rangeTest":
                      device.moduleConfig.rangeTest =
                        config.payloadVariant.rangeTest;
                      break;
                    case "telemetry":
                      device.moduleConfig.telemetry =
                        config.payloadVariant.telemetry;
                      break;
                    case "cannedMessage":
                      device.moduleConfig.cannedMessage =
                        config.payloadVariant.cannedMessage;
                      break;
                  }
                }
              })
            );
          },
          setHardware: (hardware: Protobuf.MyNodeInfo) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.hardware = hardware;
                }
              })
            );
          },
          setMetrics: (metrics: Types.TelemetryPacket) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                let node = device?.nodes.find(
                  (n) => n.data.num === metrics.packet.from
                );
                if (device && !node) {
                  node = {
                    data: Protobuf.NodeInfo.create({
                      num: metrics.packet.from,
                      snr: metrics.packet.rxSnr,
                      lastHeard: new Date().getSeconds(),
                    }),
                    deviceMetrics: Protobuf.DeviceMetrics.create(),
                    environmentMetrics: Protobuf.EnvironmentMetrics.create(),
                  };

                  device.nodes.push(node);
                }
                if (node) {
                  switch (metrics.data.variant.oneofKind) {
                    case "deviceMetrics":
                      node.deviceMetrics = metrics.data.variant.deviceMetrics;
                      break;
                    case "environmentMetrics":
                      node.environmentMetrics =
                        metrics.data.variant.environmentMetrics;
                      break;
                  }
                }
              })
            );
          },
          setActiveChat: (chatIndex) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.activeChat = chatIndex;
                }
              })
            );
          },
          setActivePage: (page) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.activePage = page;
                }
              })
            );
          },
          addNodeInfo: (nodeInfo) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  const node = device.nodes.find(
                    (node) => node.data.num === nodeInfo.data.num
                  );
                  if (node) {
                    node.data = nodeInfo.data;
                    // if (action.payload.packet.rxTime) {
                    //   node.data.lastHeard = new Date(
                    //     action.payload.packet.rxTime * 1000,
                    //   ).getTime();
                    // }
                  } else {
                    device.nodes.push({
                      data: Protobuf.NodeInfo.create(nodeInfo.data),
                      deviceMetrics: Protobuf.DeviceMetrics.create(),
                      environmentMetrics: Protobuf.EnvironmentMetrics.create(),
                    });
                  }
                }
              })
            );
          },
          addUser: (user) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  const node = device.nodes.find(
                    (node) => node.data.num === user.packet.from
                  );
                  if (node) {
                    node.data.user = user.data;
                    // if (action.payload.packet.rxTime) {
                    //   node.data.lastHeard = new Date(
                    //     action.payload.packet.rxTime * 1000,
                    //   ).getTime();
                    // }
                  } else {
                    device.nodes.push({
                      data: Protobuf.NodeInfo.create({
                        num: user.packet.from,
                        snr: user.packet.rxSnr,
                        user: user.data,
                      }),
                      deviceMetrics: Protobuf.DeviceMetrics.create(),
                      environmentMetrics: Protobuf.EnvironmentMetrics.create(),
                    });
                  }
                }
              })
            );
          },
          addPosition: (position) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  const node = device.nodes.find(
                    (node) => node.data.num === position.packet.from
                  );
                  if (node) {
                    node.data.position = position.data;
                    // if (action.payload.packet.rxTime) {
                    //   node.data.lastHeard = new Date(
                    //     action.payload.packet.rxTime * 1000,
                    //   ).getTime();
                    // }
                  } else {
                    console.log("PUSH333333333333333333333");
                    device.nodes.push({
                      data: Protobuf.NodeInfo.create({
                        num: position.packet.from,
                        position: position.data,
                      }),
                      deviceMetrics: Protobuf.DeviceMetrics.create(),
                      environmentMetrics: Protobuf.EnvironmentMetrics.create(),
                    });
                  }
                }
              })
            );
          },
          addConnection: (connection) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.connection = connection;
                  connection.get;
                }
              })
            );
          },
          addMessage: (message) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  device.channels
                    .find(
                      (ch) => ch.config.index === message.message.packet.channel
                    )
                    ?.messages.push(message);
                }
              })
            );
          },
          ackMessage: (channelIndex: number, messageId: number) => {
            set(
              produce<DeviceState>((draft) => {
                const device = draft.devices.get(id);
                if (device) {
                  const channel = device.channels.find(
                    (ch) => ch.config.index === channelIndex
                  );
                  if (channel) {
                    const message = channel.messages.find(
                      (msg) => msg.message.packet.id === messageId
                    );
                    if (message) {
                      message.ack = true;
                    }
                  }
                }
              })
            );
          },
        });
      })
    );

    const device = get().devices.get(id);

    if (!device) {
      throw new Error("Device not found");
    }
    return device;
  },
  removeDevice: (id) =>
    produce<DeviceState>((draft) => {
      draft.devices.delete(id);
    }),
  getDevices: () => Array.from(get().devices.values()),
}));

export const DeviceContext = createContext<Device | undefined>(undefined);

export const useDevice = (): Device => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error("useDevice must be used within a ConnectionProvider");
  }
  return context;
};
