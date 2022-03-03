import React, { useState, useMemo } from "react";
import { TextField, Grid } from "@material-ui/core";

import { useAppState } from "../../twilio/state";
import { BrandingType, GameType } from "../../engine/types";

import FileUpload from "./FileUpload";
import ImageUpload from "./ImageUpload";
import { validateVimeoUrl } from "./utils";

interface IProps {
  branding: BrandingType;
  setBranding: { (value: BrandingType): void };
  gameType: GameType;
}

export default function BrandingOptions(props: IProps) {
  const { user } = useAppState();
  const { branding, setBranding, gameType } = props;
  const [numberOfTables, setNumberOfTables] = useState(0);
  const [now] = useState(new Date().getTime());

  const isInvalidVimeoUrl = useMemo(() => branding.vimeoVideoUrl && !validateVimeoUrl(branding.vimeoVideoUrl), [branding.vimeoVideoUrl])

  return (
    <div>
      <Grid item xs={12}>
        <ImageUpload
          title="Table Art"
          actionTitle="Upload Table Art"
          path={`images/tournaments/table-${user.uid}-${now}`}
          imageUrl={branding.tableImageUrl}
          onImageUploaded={(imageUrl) => {
            setBranding({ ...branding, tableImageUrl: imageUrl });
          }}
        />
        {gameType === GameType.MultiTableTournament ? (
          <>
            <ImageUpload
              title="Registration Logo"
              actionTitle="Upload Registration Logo"
              path={`images/tournaments/registration-${user.uid}-${now}`}
              imageUrl={branding.registrationImageUrl}
              onImageUploaded={(imageUrl) => {
                setBranding({ ...branding, registrationImageUrl: imageUrl });
              }}
            />
            <ImageUpload
              title="Left Logo"
              actionTitle="Left Table Logo"
              path={`images/tournaments/left-${user.uid}-${now}`}
              imageUrl={branding.leftTableImageUrl}
              onImageUploaded={(imageUrl) => {
                setBranding({ ...branding, leftTableImageUrl: imageUrl });
              }}
            />
            <ImageUpload
              title="Right Logo"
              actionTitle="Right Table Logo"
              path={`images/tournaments/right-${user.uid}-${now}`}
              imageUrl={branding.rightTableImageUrl}
              onImageUploaded={(imageUrl) => {
                setBranding({ ...branding, rightTableImageUrl: imageUrl });
              }}
            />
            <ImageUpload
              title="Tournament Logo"
              actionTitle="Tournament Logo"
              path={`images/tournaments/tournament-${user.uid}-${now}`}
              imageUrl={branding.tournamentImageUrl}
              onImageUploaded={(imageUrl) => {
                setBranding({ ...branding, tournamentImageUrl: imageUrl });
              }}
            />
            <FileUpload
              title="Player List"
              actionTitle="Upload Player List (optional)"
              path={`files/tournaments/player-list-${user.uid}-${now}`}
              fileUrl={branding.playerListUrl}
              defaultFileUrl="files/player-list.csv"
              onFileUploaded={(fileUrl) => {
                setBranding({ ...branding, playerListUrl: fileUrl });
              }}
              extension="csv"
            />
            <Grid item xs={12}>
              <TextField
                margin="dense"
                id="tables"
                fullWidth
                label="Vimeo video for Lobby (https://vimeo.com/example_id)"
                error={isInvalidVimeoUrl}
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={(e) => setBranding({ ...branding, vimeoVideoUrl: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                id="tables"
                fullWidth
                label="Specify number of custom logos"
                style={{ fontSize: 40 }}
                InputLabelProps={{
                  shrink: true,
                }}
                onChange={(e) => setNumberOfTables(parseInt(e.currentTarget.value, 10))}
              />
            </Grid>
            <>
              {numberOfTables >= 0 && [...Array(numberOfTables).keys()].map((index) => (
                <ImageUpload
                  key={index}
                  title={`Table ${index + 1}`}
                  actionTitle={`Custom Logo ${index + 1}`}
                  path={`images/tournaments/custom${index + 1}-${user.uid}-${now}`}
                  imageUrl={branding.customTableLogos[index]}
                  onImageUploaded={(imageUrl) => {
                    // Something like this
                    const customTableLogos = [...branding.customTableLogos];
                    customTableLogos[index] = imageUrl;
                    setBranding({ ...branding, customTableLogos });
                  }}
                />
              ))}
            </>
          </>
        ) : null}
        <Grid item xs={12}>
          <TextField
            margin="dense"
            id="name"
            fullWidth
            label="Primary Color  (#hexvalue)"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            value={branding.primaryColor}
            onChange={(ev) =>
              setBranding({ ...branding, primaryColor: ev.currentTarget.value })
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            margin="dense"
            id="name"
            fullWidth
            label="Secondary Color (#hexvalue)"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            value={branding.secondaryColor}
            onChange={(ev) =>
              setBranding({
                ...branding,
                secondaryColor: ev.currentTarget.value,
              })
            }
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            margin="dense"
            id="name"
            fullWidth
            label="Custom CSS"
            style={{ fontSize: 40 }}
            InputLabelProps={{
              shrink: true,
            }}
            multiline
            rows={10}
            value={branding.customCss}
            onChange={(ev) =>
              setBranding({ ...branding, customCss: ev.currentTarget.value })
            }
          />
        </Grid>
      </Grid>
    </div>
  );
}
