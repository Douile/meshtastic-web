import React from 'react';

import { FiHash, FiMessageCircle } from 'react-icons/fi';

import { Layout } from '@app/components/layout';
import { useAppSelector } from '@hooks/useAppSelector';
import { IconButton } from '@meshtastic/components';
import { Protobuf } from '@meshtastic/meshtasticjs';

import { ChannelChat } from './ChannelChat';
import { DmChat } from './DmChat';
import { Message } from './Message';
import { MessageBar } from './MessageBar';

export const Messages = (): JSX.Element => {
  const [selectedChatIndex, setSelectedChatIndex] = React.useState<number>(0);

  const chatRef = React.useRef<HTMLDivElement>(null);

  const myNodeNum = useAppSelector(
    (state) => state.meshtastic.radio.hardware,
  ).myNodeNum;
  const nodes = useAppSelector((state) => state.meshtastic.nodes);
  const chats = useAppSelector((state) => state.meshtastic.chats);
  const channels = useAppSelector(
    (state) => state.meshtastic.radio.channels,
  ).filter((ch) => ch.role !== Protobuf.Channel_Role.DISABLED);

  React.useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [channels]);

  return (
    <Layout
      title="Message Groups"
      icon={<FiMessageCircle />}
      sidebarContents={
        <div className="flex flex-col gap-2">
          {nodes
            .filter((node) => node.number !== myNodeNum)
            .map((node) => (
              <DmChat
                key={node.number}
                node={node}
                selectedIndex={selectedChatIndex}
                setSelectedIndex={setSelectedChatIndex}
              />
            ))}
          {nodes.length !== 0 && channels.length !== 0 && (
            <div className="mx-2 rounded-md border-2 border-gray-300 dark:border-gray-600" />
          )}
          {channels
            .filter((channel) => channel.settings?.name !== 'admin')
            .map((channel) => (
              <ChannelChat
                key={channel.index}
                channel={channel}
                selectedIndex={selectedChatIndex}
                setSelectedIndex={setSelectedChatIndex}
              />
            ))}
        </div>
      }
    >
      <div className="flex w-full flex-col">
        <div className="flex w-full justify-between border-b border-gray-300 px-2 dark:border-gray-600 dark:text-gray-300">
          <div className="my-auto flex gap-2 py-2 text-sm">
            <IconButton icon={<FiHash className="h-4 w-4" />} />
            <div className="my-auto">
              {channels.findIndex((ch) => ch.index === selectedChatIndex) !==
              -1 ? (
                <span className="text-gray-500 dark:text-gray-400">
                  {channels[selectedChatIndex]?.settings?.name.length
                    ? channels[selectedChatIndex]?.settings?.name
                    : channels[selectedChatIndex]?.role ===
                      Protobuf.Channel_Role.PRIMARY
                    ? 'Primary'
                    : `Channel: ${channels[selectedChatIndex]?.index}`}
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  {nodes.find((n) => n.number === selectedChatIndex)?.user
                    ?.longName ?? 'Unknown'}
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          ref={chatRef}
          className="flex flex-grow flex-col space-y-2 overflow-y-auto border-b border-gray-300 bg-white pb-6 dark:border-gray-600 dark:bg-secondaryDark"
        >
          <div className="mt-auto">
            {chats[selectedChatIndex]?.messages.map((message, index) => (
              <Message
                key={index}
                message={message.message.data}
                ack={message.ack}
                rxTime={message.received}
                lastMsgSameUser={
                  index === 0
                    ? false
                    : chats[selectedChatIndex].messages[index - 1].message
                        .packet.from === message.message.packet.from
                }
                sender={nodes.find((node) => {
                  console.log(message);

                  return node.number === message.message.packet.from;
                })}
              />
            ))}
          </div>
        </div>
        <MessageBar chatIndex={selectedChatIndex} />
      </div>
    </Layout>
  );
};