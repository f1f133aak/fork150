/* eslint-disable no-irregular-whitespace */
import React, { useEffect, useState } from 'react';
import styles from 'styles/app.module.scss';
import button from 'styles/button.module.scss';
import clsx from 'clsx';
import { RegisterOptions, useForm } from 'react-hook-form';
import { FormGroup } from './components/form-group';
import { useLocalStorage } from './utils/hooks';
import { isURL, isValidMnemonicOrPrivateKey } from './utils/validations';
import { isAddress } from 'ethers/lib/utils';
import { ethers } from 'ethers';

type FormValues = {
  privateKeyOrMnemonic: string;
  rewardCxoAddress: string;
  rpcAddress: string;
  relayUrl: string;
  gasPrice: string;
  gasLimit: string;
};

type Props = {
  initialValues: FormValues;
  onStart: (values: FormValues) => void;
};

const FormScreen = ({ initialValues, onStart }: Props) => {
  const [advancedSettings, setAdvancedSettings] = useLocalStorage(
    'advancedSettings',
    false
  );
  const [addressFromKey, setAddressFromKey] = useState(''); // The address derived from the private key or mnemonic
  const { register, handleSubmit, formState, getValues, watch } =
    useForm<FormValues>({
      mode: 'onChange',
      defaultValues: initialValues,
    });

  function getFormGroupProps({
    name,
    label,
    helpText,
    options,
  }: {
    name: keyof FormValues;
    label: string;
    helpText?: string;
    options?: RegisterOptions<FormValues, typeof name>;
  }) {
    return {
      name: name,
      label: label,
      helpText: helpText,
      inputProps: register(name, options),
      errorMessage: formState.errors[name]?.message,
      dirty: name in formState.dirtyFields,
      value: getValues()[name],
    };
  }

  const privateKeyOrMnemonic = watch('privateKeyOrMnemonic');
  const type = isValidMnemonicOrPrivateKey(privateKeyOrMnemonic);
  useEffect(() => {
    if (type == 'invalid') {
      return;
    }
    const wallet =
      type === 'mnemonic'
        ? ethers.Wallet.fromMnemonic(privateKeyOrMnemonic)
        : new ethers.Wallet(privateKeyOrMnemonic);
    setAddressFromKey(wallet.address);
  }, [privateKeyOrMnemonic]);

  return (
    <section>
      <form onSubmit={handleSubmit(onStart)}>
        <FormGroup
          {...getFormGroupProps({
            name: 'privateKeyOrMnemonic',
            label: 'Your private key/Mnemonic',
            helpText:
              'Enter the private key or mnemonic phrase for the wallet that holds MATIC that will be spent to relay transactions.',
            options: {
              required: 'Please enter private key or mnemonic',
              validate: (value: string) =>
                isValidMnemonicOrPrivateKey(value) !== 'invalid' ||
                'Invalid private key or mnemonic',
            },
          })}
        />
        {type !== 'invalid' && (
          <div className={styles.ethAddress}>Address: {addressFromKey}</div>
        )}
        <FormGroup
          {...getFormGroupProps({
            name: 'rewardCxoAddress',
            label: 'Reward CXO address',
            helpText:
              'Enter the address where CXO are stored on the Polygon network (and where the reward will be sent to).',
            options: {
              required: 'Please enter a CXO address',
              validate: (value: string) =>
                isAddress(value) || 'Please provide a valid address',
            },
          })}
        />
        <FormGroup
          {...getFormGroupProps({
            name: 'rpcAddress',
            label: 'URL endpoint for Polygon node',
            helpText: 'Enter the Polygon node RPC URL.',
            options: {
              required: 'Please enter a URL',
              validate: (value: string) =>
                isURL(value) || 'Provide a valid URL',
            },
          })}
        />
        <FormGroup
          {...getFormGroupProps({
            name: 'relayUrl',
            label: 'Relay API URL',
            helpText:
              'Enter the URL of the API endpoint to retrieve relay data',
            options: {
              required: 'Please enter a URL',
              validate: (value: string) =>
                isURL(value) || 'Provide a valid URL',
            },
          })}
        />
        {!advancedSettings ? (
          <button
            className={styles.advancedSettings}
            onClick={() => setAdvancedSettings(true)}
          >
            Show advanced settings
          </button>
        ) : (
          <>
            <h3>Advanced settings</h3>
            <FormGroup
              {...getFormGroupProps({
                name: 'gasPrice',
                label: 'Custom gas price (in gwei)',
                helpText: 'Enter your custom gas price here.',
              })}
            />
            <FormGroup
              {...getFormGroupProps({
                name: 'gasLimit',
                label: 'Custom gas limit (in gwei)',
                helpText: 'Enter your custom gas limit here.',
              })}
            />
            <button
              className={styles.advancedSettings}
              onClick={() => setAdvancedSettings(false)}
            >
              Hide advanced settings
            </button>
          </>
        )}
        <div className={styles.runContainer}>
          <button
            className={clsx(button.button, button.buttonGreen)}
            type="submit"
          >
            Start
          </button>
        </div>
      </form>
    </section>
  );
};

export default FormScreen;