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

const useStyles = makeStyles((theme) => ({
  successAlert: {
    marginBottom: theme.spacing(1),
  },
  progressBar: {
    marginBottom: theme.spacing(1),
  },
  nameInput: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  aktionInput: {
    marginBottom: theme.spacing(1),
  },
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
  const [uploadState, setUploadState] = React.useState<UploadNotStarted | UploadRunning | UploadComplete>({
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
    console.log("ok");
    setPersistentName(state.name);
    setUploadState({ type: "UploadRunning", progress: 0 });

    for (let index = 0; index < fileList.length; index++) {
      setUploadState({ type: "UploadRunning", progress: index });
      const file = fileList[index];
      const uploadTicket = await axios.post(`${apiBaseUrl}/upload`, {
        name: `${state.jahr} ${state.aktion} (${state.name})`,
        file: file.name,
      });
      const uploadUrl = uploadTicket.data.uploadUrl;

      await axios.put(uploadUrl, await file.arrayBuffer(), {
        headers: { "Content-Range": `bytes 0-${file.size - 1}/${file.size}` },
      });
    }
    setUploadState({ type: "UploadComplete" });
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
      <Grid item xs={12}>
        {uploadState.type === "UploadNotStarted" && (
          <>
            <Grid container spacing={2}>
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
                  <Button variant="contained" color="secondary" onClick={() => inputRef.current?.click()}>
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
            </Grid>
          </>
        )}

        {uploadState.type === "UploadRunning" && (
          <>
            <Typography paragraph>Deine Bilder werden jetzt hochgeladen, dies kann einige Zeit dauern.</Typography>
            <LinearProgress
              variant="determinate"
              value={(uploadState.progress / fileList.length) * 100}
              className={classes.progressBar}
            />
            <CircularProgress size="16px" className={classes.circularProgress} />
            <Typography paragraph>
              Bild {uploadState.progress + 1} von {fileList.length} wird hochgeladen.
            </Typography>
          </>
        )}

        {uploadState.type === "UploadComplete" && (
          <>
            <Alert severity="success" className={classes.successAlert}>
              Vielen Dank, wir haben deine Bilder bekommen!
            </Alert>
            <Button variant="contained" onClick={() => window.location.reload()} className={classes.moreImagesButton}>
              Weitere Bilder hochladen
            </Button>
          </>
        )}
      </Grid>
    </>
  );
};
