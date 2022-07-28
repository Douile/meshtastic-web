import type React from "react";
import { useCallback, useEffect, useState } from "react";

import { Button, majorScale, Pane } from "evergreen-ui";
import { FiPlusCircle } from "react-icons/fi";

import { useDeviceStore } from "@app/core/stores/deviceStore.js";
import { subscribeAll } from "@app/core/subscriptions.js";
import { randId } from "@app/core/utils/randId.js";
import { Constants, IBLEConnection } from "@meshtastic/meshtasticjs";

import type { CloseProps } from "../SlideSheets/NewDevice.js";

export const BLE = ({ close }: CloseProps): JSX.Element => {
  const [bleDevices, setBleDevices] = useState<BluetoothDevice[]>([]);
  const { addDevice } = useDeviceStore();

  const updateBleDeviceList = useCallback(async (): Promise<void> => {
    if (navigator.bluetooth)
      setBleDevices(await navigator.bluetooth.getDevices());
  }, []);

  if (navigator.bluetooth) {
    navigator.bluetooth.addEventListener("advertisementreceived", (e) => {
      console.log(e);
    });

    navigator.bluetooth.addEventListener("availabilitychanged", (e) => {
      console.log(e);
    });
  }

  useEffect(() => {
    void updateBleDeviceList();
  }, [updateBleDeviceList]);

  const onConnect = async (BLEDevice: BluetoothDevice) => {
    const id = randId();
    const device = addDevice(id);
    const connection = new IBLEConnection(id);
    await connection.connect({
      device: BLEDevice,
    });
    device.addConnection(connection);
    subscribeAll(device, connection);
    close();
  };

  return (
    <Pane
      display="flex"
      flexDirection="column"
      padding={majorScale(2)}
      gap={majorScale(2)}
    >
      {bleDevices.map((device, index) => (
        <Button
          key={index}
          onClick={() => {
            void onConnect(device);
          }}
        >
          {device.name}
        </Button>
      ))}

      <Button
        appearance="primary"
        gap={majorScale(1)}
        onClick={() => {
          void navigator.bluetooth
            .requestDevice({
              filters: [{ services: [Constants.SERVICE_UUID] }],
            })
            .then((device) => {
              const exists = bleDevices.findIndex((d) => d.id === device.id);
              if (exists === -1) {
                setBleDevices(bleDevices.concat(device));
              }
            });
        }}
      >
        New device
        <FiPlusCircle />
      </Button>
    </Pane>
  );
};
