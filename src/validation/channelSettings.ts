import { IsBoolean, IsInt, Length } from "class-validator";

import type { Protobuf } from "@meshtastic/meshtasticjs";

export class ChannelSettingsValidation implements Protobuf.ChannelSettings {
  @IsInt()
  channelNum: number;

  psk: Uint8Array;

  @Length(1, 30)
  name: string;

  @IsInt()
  id: number;

  @IsBoolean()
  uplinkEnabled: boolean;

  @IsBoolean()
  downlinkEnabled: boolean;
}
