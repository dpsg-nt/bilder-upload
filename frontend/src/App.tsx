import * as React from "react";

import { makeStyles } from "@material-ui/core/styles";

import { BilderUpload } from "./BilderUpload";
import { PageContainer } from "./components/PageContainer";
import { PageHeader } from "./components/PageHeader";
import { PageSection } from "./components/PageSection";

const useStyles = makeStyles((theme) => ({
  app: {
    backgroundColor: theme.palette.primary.main,
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 10px",
    fontSize: "12px",
    color: "#fff",
  },
}));

export const App: React.FC = () => {
  const styles = useStyles();
  return (
    <div className={styles.app}>
      <PageContainer>
        <PageHeader title="Bilder Upload" />
        <PageSection>
          <BilderUpload />
        </PageSection>
      </PageContainer>
    </div>
  );
};
