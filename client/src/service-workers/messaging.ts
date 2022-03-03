import firebase from "firebase/app";

export function register() {
  firebase
    .messaging()
    .usePublicVapidKey(
      "BIsy1cdPTurULdJ-0tT1vQj7Jp-uDPiVBakHQKt9tjPug6Ztx_kgxphXQYs_lRnU7hAZmoa3DtZ4BFCDXBCPn-I"
    );
}
export function unregister() {
  //
}
