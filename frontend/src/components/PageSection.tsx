import * as React from "react";

import Grid from "@material-ui/core/Grid";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(3),
  },
}));

export const PageSection: React.FC = (props) => {
  const styles = useStyles();
  return (
    <Grid item xs={12}>
      <Paper elevation={1} className={styles.paper}>
        <Grid container spacing={2}>
          {props.children}
        </Grid>
      </Paper>
    </Grid>
  );
};
