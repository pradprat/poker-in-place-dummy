import firebase from "firebase";
import React, { useState } from "react";
import { Button, InputLabel, Grid, Link } from "@material-ui/core";

interface IFileUploadProps {
  title: string;
  actionTitle: string;
  path: string;
  extension: string;
  fileUrl?: string;
  defaultFileUrl?: string;
  onFileUploaded: { (fileUrl: string): void };
}

export default function FileUpload(props: IFileUploadProps) {
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUrl, setFileUrl] = useState(props.fileUrl);
  const onUploadFile = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files[0];
    if (file) {
      const storageRef = firebase.storage().ref();

      const fileExtension = props.extension;
      const fileRef = storageRef.child(
        `${props.path}.${fileExtension}`
      );
      setFileUploading(true);
      fileRef.put(file).then((snapshot) => {
        snapshot.ref.getDownloadURL().then(async (downloadUrl) => {
          setFileUploading(false);
          setFileUrl(downloadUrl);
          props.onFileUploaded(downloadUrl);
        });
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
            disabled={fileUploading}
          >
            {props.actionTitle}
          </Button>
        </label>
      </Grid>
      <Grid item xs={6}>
        <InputLabel shrink>File Preview</InputLabel>
        <Link
          href={fileUrl || props.defaultFileUrl}
          color="secondary"
        >
          {fileUrl || props.defaultFileUrl}
        </Link>
      </Grid>
      <Grid item xs={6} />
    </Grid>
  );
}