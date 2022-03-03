
// import React from "react";
declare module "react-chat-window" {
  export interface IMessageData {
    text: string;
  }
  export interface IMessage {
    author: string;
    type: string;
    data: IMessageData;
  }
  export interface ILauncherProps { }
  export interface IAgentProfile {
    teamName: string;
    imageUrl: string;
  }
  export interface ILauncher {
    agentProfile: IAgentProfile;
    messageList: IMessage[];
    showEmoji?: boolean;
    isOpen: boolean;
    newMessagesCount?: number;
    onMessageWasSent: (message: IMessage) => void;
    handleClick: () => void;
  }
  export const Launcher: React.ComponentType<ILauncher>;
}

declare module "react-chat-elements" {
  import * as React from "react";
  import * as ReactDOM from "react-dom";

  import ICustomMap from "./types/ICustomMap";

  interface AvatarProps extends React.Props<Avatar> {
    src: string;
    alt: string;
    size?: string;
    type?: string;
    sideElement?: React.ReactNode;
  }

  interface Avatar extends React.ComponentClass<AvatarProps> { }
  export const Avatar: Avatar;

  interface ButtonProps extends React.Props<Button> {
    type?: string;
    disabled?: string;
    text: string;
    buttonRef?: () => void;
    onClick?: () => void;
    color?: string;
    backgroundColor?: string;
  }

  interface Button extends React.ComponentClass<ButtonProps> { }
  export const Button: Button;

  interface ChatListProps extends React.Props<ChatList> {
    className?: string;
    dataSource: any[];
    onClick?: (value: any) => void;
    onContextMent?: () => void;
  }

  interface ChatList extends React.ComponentClass<ChatListProps> { }
  export const ChatList: ChatList;

  interface ChatItemProps extends React.Props<ChatItem> {
    avatar: string;
    avatarFlexible?: boolean;
    alt: string;
    title: string;
    subtitle: string;
    date: Date;
    dateString: string;
    unread: number;
    onClick?: (value: any) => void;
    onContextMent?: () => void;
    statusColor?: string;
    statusText?: string;
  }

  interface ChatItem extends React.ComponentClass<ChatItemProps> { }
  export const ChatItem: ChatItem;

  interface DropdownProps extends React.Props<Dropdown> {
    animationType?: string;
    animationPosition?: string;
    items: ICustomMap[];
    onSelect?: () => void;
    buttonProps?: ICustomMap;
  }

  interface Dropdown extends React.ComponentClass<DropdownProps> { }
  export const Dropdown: Dropdown;

  interface InputProps extends React.Props<Input> {
    className?: string;
    placeholder?: string;
    defaultValue?: string;
    onChange?: () => void;
    multiline?: boolean;
    autoheight?: boolean;
    minheight?: number;
    maxHeight?: number;
    inputStyle?: ICustomMap;
    leftButtons?: React.ReactNode;
    rightButtons?: React.ReactNode;
    inputRef?: () => void;
    maxlength?: number;
    ref?: LegacyRef<T>;
    onKeyPress?: React.KeyboardEventHandler<T>;
  }

  interface Input extends React.ComponentClass<InputProps> { }
  export const Input: Input;

  interface LocationMessageProps extends React.Props<LocationMessage> {
    src?: string;
    apiKey?: string;
    zoom?: number;
    markerColor?: string;
    data: ICustomMap;
    target?: string;
    onOpen?: () => void;
  }

  interface LocationMessage
    extends React.ComponentClass<LocationMessageProps> { }
  export const LocationMessage: LocationMessage;

  interface MessageBoxProps extends React.Props<MessageBox> {
    id?: string;
    position?: string;
    type?: string;
    text: string;
    title: string;
    titleColor?: string;
    data: ICustomMap;
    date?: Date;
    dateString?: string;
    onClick?: () => void;
    onOpen?: () => void;
    onDownload?: () => void;
    onTitleClick?: () => void;
    onForwardClick?: () => void;
    forwarded?: boolean;
    status?: string;
    notch?: boolean;
    avatar?: string;
    renderAddCmp?: React.ReactNode;
    copiableDate?: boolean;
  }

  interface MessageBox extends React.ComponentClass<MessageBoxProps> { }
  export const MessageBox: MessageBox;

  interface MessageListProps extends React.Props<MessageList> {
    className?: string;
    dataSource: any[];
    lockable?: boolean;
    toBottomHeight?: number | "100%";
    onClick?: () => void;
    onOpen?: () => void;
    onDownload?: () => void;
    onScroll?: () => void;
    onForwardClick?: () => void;
    downButton?: boolean;
    downButtonBadge?: boolean | number;
    onDownButtonClick?: () => void;
  }

  interface MessageList extends React.ComponentClass<MessageListProps> { }
  export const MessageList: MessageList;

  interface NavBarProps extends React.Props<NavBar> {
    type?: string;
    top?: ICustomMap;
    center: ICustomMap;
    bottom: ICustomMap;
  }

  interface NavBar extends React.ComponentClass<NavBarProps> { }
  export const NavBar: NavBar;

  interface PopupProps extends React.Props<Popup> {
    show?: boolean;
    header: string;
    headerButtons?: ICustomMap[];
    text: string;
    color?: string;
    footerButtons?: ICustomMap[];
    renderHeader?: () => void;
    renderContent?: () => void;
    renderFooter?: () => void;
  }

  interface Popup extends React.ComponentClass<PopupProps> { }
  export const Popup: Popup;

  interface SideBarProps extends React.Props<SideBar> {
    type?: string;
    top?: ICustomMap;
    center?: ICustomMap;
    bottom?: ICustomMap;
  }

  interface SideBar extends React.ComponentClass<SideBarProps> { }
  export const SideBar: SideBar;

  interface SystemMessageProps extends React.Props<SystemMessage> {
    text: string;
  }

  interface SystemMessage extends React.ComponentClass<SystemMessageProps> { }
  export const SystemMessage: SystemMessage;
}