interface BluetoothRequestDeviceFilter {
  namePrefix?: string;
  name?: string;
  services?: string[];
}

interface BluetoothRemoteGATTCharacteristicLike {
  uuid: string;
  properties: {
    write?: boolean;
    writeWithoutResponse?: boolean;
    notify?: boolean;
    read?: boolean;
  };
  writeValue(data: BufferSource): Promise<void>;
  writeValueWithoutResponse?(data: BufferSource): Promise<void>;
}

interface BluetoothRemoteGATTServiceLike {
  uuid: string;
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristicLike>;
  getCharacteristics(): Promise<BluetoothRemoteGATTCharacteristicLike[]>;
}

interface BluetoothRemoteGATTServerLike {
  connected: boolean;
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTServiceLike>;
  getPrimaryServices(): Promise<BluetoothRemoteGATTServiceLike[]>;
  connect(): Promise<BluetoothRemoteGATTServerLike>;
  disconnect(): void;
}

interface BluetoothDeviceLike {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServerLike;
}

interface Bluetooth {
  requestDevice(options: {
    filters?: BluetoothRequestDeviceFilter[];
    optionalServices?: string[];
    acceptAllDevices?: boolean;
  }): Promise<BluetoothDeviceLike>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
