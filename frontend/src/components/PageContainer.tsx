import * as React from "react";

import Grid from "@material-ui/core/Grid";
import Container from "@material-ui/core/Container";
import { makeStyles, Theme } from "@material-ui/core/styles";

export interface Props {
  maxWidth?: string;
}

const useStyles = makeStyles<Theme, { maxWidth: string }>(() => ({
  root: (props) => ({
    maxWidth: props.maxWidth,
  }),
}));

export const PageContainer: React.FC<Props> = ({ maxWidth = "600px", children }) => {
  const classes = useStyles({ maxWidth });
  return (
    <Container className={classes.root}>
      <Grid container spacing={4}>
        {children}
      </Grid>
    </Container>
  );
};
