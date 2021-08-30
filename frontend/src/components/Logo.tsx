import * as React from "react";

import { ReactComponent as LogoSvg } from "./Logo.svg";

import makeStyles from "@material-ui/core/styles/makeStyles";

const useStyles = makeStyles({
  logo: {
    height: "100%",
  },
});

export const Logo: React.FC<{ className?: string }> = (props) => {
  const styles = useStyles();
  return <LogoSvg className={`${styles.logo} ${props.className}`} />;
};
