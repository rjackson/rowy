import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { useDebouncedCallback } from "use-debounce";
import _get from "lodash/get";

import {
  Button,
  Checkbox,
  Divider,
  Grid,
  InputAdornment,
  List,
  ListItemIcon,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
  Radio,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

import { IConnectServiceSelectProps } from ".";
import useStyles from "./styles";
import Loading from "@src/components/Loading";
import { useProjectContext } from "@src/contexts/ProjectContext";
import { replacer } from "@src/utils/fns";

export interface IPopupContentsProps
  extends Omit<IConnectServiceSelectProps, "className" | "TextFieldProps"> {}

// TODO: Implement infinite scroll here
export default function PopupContents({
  value = [],
  onChange,
  config,
  docRef,
}: IPopupContentsProps) {
  const { rowyRun, tableState } = useProjectContext();
  // const url = config.url ;
  const elementId = config.elementId;
  const multiple = Boolean(config.multiple);

  const classes = useStyles();

  // Webservice search query
  const [query, setQuery] = useState("");
  // Webservice response
  const [response, setResponse] = useState<any | null>(null);

  const [docData, setDocData] = useState<any | null>(null);
  useEffect(() => {
    docRef.get().then((d) => setDocData(d.data()));
  }, []);
  const hits: any["hits"] = response;
  const [search] = useDebouncedCallback(
    async (query: string) => {
      if (!docData) return;
      const resp = await rowyRun!({
        route: { method: "POST", path: "/connect" },
        body: {
          columnKey: "game",
          query: query,
          schemaDocPath: tableState?.config.tableConfig.path,
        },
      });
      console.log(resp);
      setResponse(resp);
    },
    1000,
    { leading: true }
  );

  useEffect(() => {
    search(query);
  }, [query, docData]);

  if (!response) return <Loading />;

  const select = (hit: any) => () => {
    if (multiple) onChange([...value, hit]);
    else onChange([hit]);
  };
  const deselect = (hit: any) => () => {
    if (multiple)
      onChange(value.filter((v) => v[elementId] !== hit[elementId]));
    else onChange([]);
  };

  const selectedValues = value?.map((item) => _get(item, elementId));

  const clearSelection = () => onChange([]);

  return (
    <Grid container direction="column" className={classes.grid}>
      <Grid item className={classes.searchRow}>
        <TextField
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          fullWidth
          variant="filled"
          margin="dense"
          label="Search items"
          className={classes.noMargins}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        />
      </Grid>

      <Grid item xs className={classes.listRow}>
        <List className={classes.list}>
          {hits.map((hit) => {
            const isSelected = selectedValues.some((v) => v === hit[elementId]);
            console.log({
              isSelected,
              selectedValues,
              elementId,
            });
            return (
              <React.Fragment key={_get(hit, elementId)}>
                <MenuItem
                  dense
                  onClick={isSelected ? deselect(hit) : select(hit)}
                >
                  <ListItemIcon className={classes.checkboxContainer}>
                    {multiple ? (
                      <Checkbox
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        color="secondary"
                        className={classes.checkbox}
                        disableRipple
                        inputProps={{
                          "aria-labelledby": `label-${_get(hit, elementId)}`,
                        }}
                      />
                    ) : (
                      <Radio
                        edge="start"
                        checked={isSelected}
                        tabIndex={-1}
                        color="secondary"
                        className={classes.checkbox}
                        disableRipple
                        inputProps={{
                          "aria-labelledby": `label-${_get(hit, elementId)}`,
                        }}
                      />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    id={`label-${_get(hit, elementId)}`}
                    primary={config.labelFormatter.replace(
                      /\{\{(.*?)\}\}/g,
                      replacer(hit)
                    )}
                  />
                </MenuItem>
                <Divider className={classes.divider} />
              </React.Fragment>
            );
          })}
        </List>
      </Grid>

      {multiple && (
        <Grid item className={clsx(classes.footerRow, classes.selectedRow)}>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography
              variant="button"
              color="textSecondary"
              className={classes.selectedNum}
            >
              {value?.length} of {hits?.length}
            </Typography>

            <Button
              disabled={!value || value.length === 0}
              onClick={clearSelection}
              color="primary"
              className={classes.selectAllButton}
            >
              Clear selection
            </Button>
          </Grid>
        </Grid>
      )}
    </Grid>
  );
}