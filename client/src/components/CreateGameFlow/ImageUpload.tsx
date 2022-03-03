import firebase from "firebase";
import React, { useState } from "react";
import { Button, InputLabel, Grid } from "@material-ui/core";

import { MiscOverrides } from "../../theme";

interface IImageUploadProps {
  title: string;
  actionTitle: string;
  path: string;
  imageUrl?: string;
  onImageUploaded: { (imageUrl: string): void };
  onImageUploadError?: { (err: any): void };
}

const miscOverrides = MiscOverrides[window.location.hostname];
const tableLogo =
  miscOverrides && miscOverrides.tableLogo
    ? miscOverrides.tableLogo
    : "/images/logotype-white.png";

export default function ImageUpload(props: IImageUploadProps) {
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(props.imageUrl);
  const onUploadFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files[0];
    if (file) {
      const storageRef = firebase.storage().ref();

      const fileExtension = file.type === "image/jpeg" ? "jpg" : "png";
      const imageRef = storageRef.child(
        // `images/tournaments/table-${props.user.uid}.${fileExtension}`
        `${props.path}.${fileExtension}`
      );
      setImageUploading(true);
      imageRef.put(file).then((snapshot) => {
        snapshot.ref.getDownloadURL().then(async (downloadUrl) => {
          setImageUrl(downloadUrl);
          props.onImageUploaded(downloadUrl);
        });
      }).catch((err) => {
        console.error(err);
        props.onImageUploadError && props.onImageUploadError(err);
      }).finally(() => {
        setImageUploading(false);
      });
    }
  };
  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <InputLabel shrink>{props.title}</InputLabel>
        <label htmlFor={props.path} className="MuiInput-formControl">
          <input
            style={{ display: "none" }}
            id={props.path}
            name={props.path}
            type="file"
            onChange={onUploadFile}
          />

          <Button
            color="secondary"
            variant="contained"
            component="span"
            disabled={imageUploading}
          >
            {props.actionTitle}
          </Button>
        </label>
      </Grid>
      <Grid item xs={6}>
        <InputLabel shrink>Image Preview</InputLabel>
        {imageUrl && (
          <img style={{ width: "150px" }} src={imageUrl || tableLogo} />
        )}
      </Grid>
    </Grid>
  );
}
