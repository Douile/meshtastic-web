import type React from "react";
import { useEffect, useState } from "react";

import { FormField, SelectField, Switch, TextInputField } from "evergreen-ui";
import { Controller, useForm } from "react-hook-form";
import { base16 } from "rfc4648";

import { UserValidation } from "@app/validation/config/user.js";
import { Form } from "@components/form/Form";
import { useDevice } from "@core/stores/deviceStore.js";
import { renderOptions } from "@core/utils/selectEnumOptions.js";
import { classValidatorResolver } from "@hookform/resolvers/class-validator";
import { Protobuf } from "@meshtastic/meshtasticjs";

export const User = (): JSX.Element => {
  const { hardware, nodes, connection } = useDevice();
  const [loading, setLoading] = useState(false);

  const myNode = nodes.find((n) => n.data.num === hardware.myNodeNum);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
  } = useForm<UserValidation>({
    defaultValues: myNode?.data.user,
    resolver: classValidatorResolver(UserValidation),
  });

  useEffect(() => {
    reset({
      longName: myNode?.data.user?.longName,
      shortName: myNode?.data.user?.shortName,
      isLicensed: myNode?.data.user?.isLicensed,
    });
  }, [reset, myNode]);

  const onSubmit = handleSubmit((data) => {
    setLoading(true);

    if (myNode?.data.user) {
      void connection?.setOwner({ ...myNode.data.user, ...data }, async () => {
        reset({ ...data });
        setLoading(false);
        await Promise.resolve();
      });
    }
  });

  return (
    <Form loading={loading} dirty={isDirty} onSubmit={onSubmit}>
      {JSON.stringify(errors.antAzimuth?.message)}
      {JSON.stringify(errors.antGainDbi?.message)}
      {JSON.stringify(errors.hwModel?.message)}
      {JSON.stringify(errors.id?.message)}
      {JSON.stringify(errors.isLicensed?.message)}
      {JSON.stringify(errors.longName?.message)}
      {JSON.stringify(errors.shortName?.message)}
      {JSON.stringify(errors.txPowerDbm?.message)}
      <TextInputField
        label="Device ID"
        description="Preset unique identifier for this device."
        isInvalid={!!errors.id?.message}
        validationMessage={errors.id?.message}
        {...register("id")}
        readOnly
      />
      <TextInputField
        label="Device Name"
        description="Personalised name for this device."
        {...register("longName")}
      />
      <TextInputField
        label="Short Name"
        description="This is a description."
        maxLength={3}
        {...register("shortName")}
      />
      <TextInputField
        label="Mac Address"
        description="This is a description."
        disabled
        value={
          base16
            .stringify(myNode?.data.user?.macaddr ?? [])
            .match(/.{1,2}/g)
            ?.join(":") ?? ""
        }
        readOnly
      />
      <SelectField
        label="Hardware"
        description="This is a description."
        disabled
        isInvalid={!!errors.hwModel?.message}
        validationMessage={errors.hwModel?.message}
        {...register("hwModel", { valueAsNumber: true })}
        // readOnly
      >
        {renderOptions(Protobuf.HardwareModel)}
      </SelectField>
      <FormField
        label="Licenced Operator?"
        description="Description"
        isInvalid={!!errors.isLicensed?.message}
        validationMessage={errors.isLicensed?.message}
      >
        <Controller
          name="isLicensed"
          control={control}
          render={({ field: { value, ...field } }) => (
            <Switch height={24} marginLeft="auto" checked={value} {...field} />
          )}
        />
      </FormField>
      <TextInputField
        label="Transmit Power"
        description="This is a description."
        hint="dBm"
        type="number"
        {...register("txPowerDbm", { valueAsNumber: true })}
      />
      <TextInputField
        label="Antenna Gain"
        description="This is a description."
        hint="dBi"
        type="number"
        {...register("antGainDbi", { valueAsNumber: true })}
      />
      <TextInputField
        label="Antenna Azimuth"
        description="This is a description."
        hint="°"
        type="number"
        {...register("antAzimuth", { valueAsNumber: true })}
      />
    </Form>
  );
};
