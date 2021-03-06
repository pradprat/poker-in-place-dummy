/* eslint-disable react/no-access-state-in-setstate */
import * as React from "react";
import { TextField } from "@material-ui/core";

import isEmailFn from "./isEmail";
import "./style.css";

export interface IReactMultiEmailProps {
  emails?: string[];
  onChange?: (emails: string[]) => void;
  noClass?: boolean;
  validateEmail?: (email: string) => boolean;
  style?: object;
  getLabel: (
    email: string,
    index: number,
    removeEmail: (index: number) => void
  ) => void;
  className?: string;
  placeholder?: string | React.ReactNode;
}

export interface IReactMultiEmailState {
  focused?: boolean;
  propsEmails?: string[];
  emails: string[];
  inputValue?: string;
}

class ReactMultiEmail extends React.Component<
  IReactMultiEmailProps,
  IReactMultiEmailState
> {
  // eslint-disable-next-line react/state-in-constructor
  state = {
    focused: false,
    emails: [] as string[],
    inputValue: "",
  };

  emailInputRef: React.RefObject<HTMLInputElement>;

  static getDerivedStateFromProps(
    nextProps: IReactMultiEmailProps,
    prevState: IReactMultiEmailState
  ) {
    if (prevState.propsEmails !== nextProps.emails) {
      return {
        propsEmails: nextProps.emails || [],
        emails: nextProps.emails || [],
        inputValue: "",
        focused: false,
      };
    }
    return null;
  }

  constructor(props: IReactMultiEmailProps) {
    super(props);

    this.emailInputRef = React.createRef();
  }

  findEmailAddress = (value: string, isEnter?: boolean) => {
    const { validateEmail } = this.props;
    const validEmails: string[] = [];
    let inputValue = "";
    const re = /[ ,;]/g;
    const isEmail = validateEmail || isEmailFn;

    const addEmails = (email: string) => {
      const emails: string[] = this.state.emails;
      for (let i = 0, l = emails.length; i < l; i++) {
        if (emails[i] === email) {
          return false;
        }
      }
      validEmails.push(email);
      return true;
    };

    if (value !== "") {
      if (re.test(value)) {
        const splitData = value.split(re).filter((n) => n !== "" && n !== undefined && n !== null);

        const setArr = new Set(splitData);
        const arr = [...setArr];

        do {
          if (isEmail(`${ arr[0]}`)) {
            addEmails(`${ arr.shift()}`);
          } else if (arr.length === 1) {
            /// ????????? ??????????????? inputValue??? ????????????
            inputValue = `${ arr.shift()}`;
          } else {
            arr.shift();
          }
        } while (arr.length);
      } else if (isEnter) {
        if (isEmail(value)) {
          addEmails(value);
        } else {
          inputValue = value;
        }
      } else {
        inputValue = value;
      }
    }

    this.setState({
      emails: [...this.state.emails, ...validEmails],
      inputValue,
    });

    if (validEmails.length && this.props.onChange) {
      this.props.onChange([...this.state.emails, ...validEmails]);
    }
  };

  onChangeInputValue = (value: string) => {
    this.findEmailAddress(value);
  };

  removeEmail = (index: number) => {
    this.setState(
      (prevState) => ({
        emails: [
          ...prevState.emails.slice(0, index),
          ...prevState.emails.slice(index + 1),
        ],
      }),
      () => {
        if (this.props.onChange) {
          this.props.onChange(this.state.emails);
        }
      }
    );
  };

  handleOnKeydown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.which) {
    case 13:
    case 9:
      e.preventDefault();
      break;
    case 8:
      if (!e.currentTarget.value) {
        this.removeEmail(this.state.emails.length - 1);
      }
      break;
    default:
    }
  };

  handleOnKeyup = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.which) {
    case 13:
    case 9:
      this.findEmailAddress(e.currentTarget.value, true);
      break;
    default:
    }
  };

  handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    this.onChangeInputValue(e.currentTarget.value);

  handleOnBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    this.setState({ focused: false });
    this.findEmailAddress(e.currentTarget.value, true);
  };

  handleOnFocus = () =>
    this.setState({
      focused: true,
    });

  render() {
    const { focused, emails, inputValue } = this.state;
    const {
      style,
      getLabel,
      className = "",
      noClass,
      placeholder,
    } = this.props;

    // removeEmail

    return (
      <div
        className={`${className} ${noClass ? "" : "react-multi-email"} ${
          focused ? "focused" : ""
        } ${inputValue === "" && emails.length === 0 ? "empty" : ""}`}
        style={style}
        onClick={() => {
          if (this.emailInputRef.current) {
            this.emailInputRef.current.focus();
          }
        }}
      >
        {placeholder ? <span data-placeholder>{placeholder}</span> : null}
        {emails.map((email: string, index: number) =>
          getLabel(email, index, this.removeEmail)
        )}
        <TextField
          ref={this.emailInputRef}
          type="text"
          value={inputValue}
          onFocus={this.handleOnFocus}
          onBlur={this.handleOnBlur}
          onChange={this.handleOnChange}
          onKeyDown={this.handleOnKeydown}
          onKeyUp={this.handleOnKeyup}
        />
      </div>
    );
  }
}

export default ReactMultiEmail;
