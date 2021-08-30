import * as React from "react";

import Grid from "@material-ui/core/Grid";
import { Logo } from "./Logo";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  header: {
    textAlign: "center",
  },
  logo: {
    width: "80vw",
    maxWidth: "200px",
  },
}));

export const PageHeader: React.FC<{ title: string }> = (props) => {
  const styles = useStyles();
  return (
    <Grid item xs={12}>
      <div className={styles.header}>
        <Logo className={styles.logo} />
        <Typography variant="h2">{props.title}</Typography>
      </div>
    </Grid>
  );
};
