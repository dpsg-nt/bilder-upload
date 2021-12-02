import * as React from "react";

import axios from "axios";
import { useForm } from "react-hook-form";

import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Button from "@material-ui/core/Button";
import LinearProgress from "@material-ui/core/LinearProgress";
import CircularProgress from "@material-ui/core/CircularProgress";
import Alert from "@material-ui/lab/Alert";
import { makeStyles, TextField } from "@material-ui/core";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";

import { apiBaseUrl } from "./config";
import { useLocalStorage } from "./utils/useLocalStorage";
import { generateYears } from "./utils/generateYears";
import { retry } from "./utils/retry";

const useStyles = makeStyles((theme) => ({
  circularProgress: {
    float: "left",
    marginTop: "5px",
    marginRight: theme.spacing(1),
  },
  moreImagesButton: {
    marginLeft: theme.spacing(1),
  },
}));

type UploadNotStarted = { type: "UploadNotStarted" };
type UploadComplete = { type: "UploadComplete" };
type UploadFailed = { type: "UploadFailed"; failedIndex: number };
type UploadRunning = {
  type: "UploadRunning";
  progress: number;
};

type FormState = { name: string; aktion: string; jahr: number };

export const BilderUpload: React.FC = () => {
  const classes = useStyles();
  const inputRef = React.createRef<HTMLInputElement>();

  const [persistentName, setPersistentName] = useLocalStorage("file-upload-name", "");

  const {
    register,
    getValues,
    setValue,
    formState: { errors },
    handleSubmit,
  } = useForm<FormState>({
    defaultValues: { name: persistentName, jahr: new Date().getFullYear() },
  });

  const [fileList, setFileList] = React.useState<File[]>([]);
  const [currentFile, setCurrentFile] = React.useState<string>();
  const [fileProgress, setFileProgress] = React.useState<number>(0);
  const [uploadState, setUploadState] = React.useState<
    UploadNotStarted | UploadRunning | UploadComplete | UploadFailed
  >({
    type: "UploadNotStarted",
  });

  const onFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: File[] = [];
    if (e.target.files) {
      for (let i = 0; i < e.target.files.length; i++) {
        files.push(e.target.files.item(i)!);
      }
    }
    setFileList(files);
  };

  const startUpload = async (state: FormState) => {
    await upload(state, 0);
  };

  const resumeUpload = async (startFromIndex: number) => {
    upload(getValues(), startFromIndex);
  };

  const upload = async (state: FormState, startFromIndex: number) => {
    setPersistentName(state.name);

    setUploadState({ type: "UploadRunning", progress: 0 });

    for (let index = startFromIndex; index < fileList.length; index++) {
      const currentFile = URL.createObjectURL(fileList[index]);
      setCurrentFile(currentFile);
      setFileProgress(0);
      setUploadState({ type: "UploadRunning", progress: index });

      const file = fileList[index];

      try {
        await retry(2, 5_000, async () => {
          const uploadTicket = await axios.post(`${apiBaseUrl}/upload`, {
            name: `${state.jahr} ${state.aktion} (${state.name})`,
            file: file.name,
          });
          const uploadUrl = uploadTicket.data.uploadUrl;

          await axios.put(uploadUrl, await file.arrayBuffer(), {
            headers: { "Content-Range": `bytes 0-${file.size - 1}/${file.size}` },
            onUploadProgress: (e) => setFileProgress(e.loaded / e.total),
          });
        });

        URL.revokeObjectURL(currentFile);
      } catch (e) {
        URL.revokeObjectURL(currentFile);
        setCurrentFile(undefined);
        setUploadState({ type: "UploadFailed", failedIndex: index });
        throw e;
      }
    }
    setUploadState({ type: "UploadComplete" });
    setCurrentFile(undefined);
  };

  return (
    <>
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={onFilesSelected}
        ref={inputRef}
        style={{ display: "none" }}
      />
      <Grid container spacing={2}>
        {uploadState.type === "UploadNotStarted" && (
          <>
            <Grid item xs={12}>
              <Typography paragraph>Wir freuen uns sehr, dass du deine Bilder mit uns teilen willst.</Typography>
              <Alert severity="info">
                Wenn du Bilder von mehreren Aktionen hast, dann lade sie bitte getrennt hoch.
              </Alert>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Dein Name"
                helperText="Damit wir wissen von wem die Bilder sind"
                error={!!errors.name}
                fullWidth
                {...register("name", { required: true })}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl style={{ width: "100%" }} error={!!errors.jahr}>
                <InputLabel shrink id="demo-simple-select-placeholder-label-label">
                  Jahr
                </InputLabel>
                <Select
                  value={getValues("jahr")}
                  onChange={(e) => setValue("jahr", parseInt(e.target.value as string))}
                >
                  {generateYears().map((year) => (
                    <MenuItem value={year} key={year}>
                      {year}
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>Das Jahr in dem die Bilder aufgenommen wurden</FormHelperText>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Name der Aktion"
                helperText="Name der Aktion von der die Bilder stammen"
                fullWidth
                error={!!errors.aktion}
                {...register("aktion", { required: true })}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography paragraph>
                <Button
                  variant={fileList.length > 0 ? "outlined" : "contained"}
                  color="secondary"
                  onClick={() => inputRef.current?.click()}
                >
                  {fileList.length > 0 ? `✓ ${fileList.length} Bilder ausgewählt` : "Bilder auswählen"}
                </Button>
              </Typography>
              {fileList.length > 0 && (
                <>
                  <Typography paragraph>Klicke "Upload starten" um deine Bilder hochzuladen.</Typography>
                  <Button variant="contained" color="secondary" onClick={handleSubmit(startUpload)}>
                    Upload starten
                  </Button>
                </>
              )}
            </Grid>
          </>
        )}

        {uploadState.type === "UploadRunning" && (
          <>
            <Grid item xs={12}>
              <Typography paragraph>Deine Bilder werden jetzt hochgeladen, dies kann einige Zeit dauern.</Typography>
            </Grid>
            <Grid item xs={12}>
              <LinearProgress variant="determinate" value={(uploadState.progress / fileList.length) * 100} />
              <CircularProgress size="16px" className={classes.circularProgress} />
              <Typography paragraph>
                Bild {uploadState.progress + 1} von {fileList.length} wird hochgeladen.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <div style={{ position: "relative" }}>
                <img src={currentFile} alt="current upload" style={{ width: "100%" }} />
                <div
                  style={{
                    position: "absolute",
                    left: `${fileProgress * 100}%`,
                    top: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "#fff",
                    opacity: 0.5,
                    transition: fileProgress < 0.01 ? "inherit" : "left 0.25s ease-in-out",
                  }}
                ></div>
              </div>
            </Grid>
          </>
        )}

        {uploadState.type === "UploadComplete" && (
          <>
            <Grid item xs={12}>
              <Alert severity="success">Vielen Dank, wir haben deine Bilder bekommen!</Alert>
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" onClick={() => window.location.reload()} className={classes.moreImagesButton}>
                Weitere Bilder hochladen
              </Button>
            </Grid>
          </>
        )}

        {uploadState.type === "UploadFailed" && (
          <>
            <Grid item xs={12}>
              <Alert severity="error">
                <Typography paragraph>
                  Oh nein, da ist etwas beim Hochladen schiefgelaufen! Probiere mit "Upload Fortsetzen" das Hochladen
                  fortzusetzen.
                </Typography>
                <Typography paragraph>
                  Wenn's trotzdem nicht weitergehen will, kannst du auch "Von Vorn Starten" probieren.
                </Typography>
                <Typography>
                  Wenn es dann noch immer nicht klappt, kontaktiere Jakob, der kann das Problem hoffentlich beheben.
                </Typography>
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                onClick={() => resumeUpload(uploadState.failedIndex)}
                className={classes.moreImagesButton}
              >
                Upload Fortsetzen
              </Button>
              <Button variant="outlined" onClick={() => window.location.reload()} className={classes.moreImagesButton}>
                Von Vorn Starten
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    </>
  );
};
