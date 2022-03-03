import React, { useState, useEffect } from "react";
import {
  GridCellParams,
  GridColumns,
  DataGrid,
  GridPageChangeParams,
  GridRowSelectedParams,
  GridValueGetterParams,
} from "@material-ui/data-grid";
import {
  useCollection,
  useCollectionOnce,
  useDocumentData,
} from "react-firebase-hooks/firestore";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  useParams,
  useRouteMatch,
  useHistory,
} from "react-router-dom";
import firebase from "firebase";
import { IconButton, Breadcrumbs } from "@material-ui/core";
import {
  SupervisorAccount as SupervisorAccountIcon,
  Edit as EditIcon,
} from "@material-ui/icons";
import { makeStyles, useTheme } from "@material-ui/core/styles";

import "./Manage.css";
import Header from "./components/Header";
import { EditTournamentDialog } from "./components/CreateGameFlow";
import { IGame, IGameStats, ITournamentDetails } from "./engine/types";

const drawerWidth = 250;

const useStyles = makeStyles((theme) => ({
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: drawerWidth,
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "stretch",
    height: "100vh",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    "& .MuiDataGrid-root": {
      border: 0,
    },
    "& > h1": {
      padding: "0 16px",
      fontSize: "1.25rem",
      "& > a": {
        color: "white",
        textDecoration: "none",
        display: "inline-block",
        "&::after": {
          content: "\"/\"",
          padding: "0 16px",
        },
        "&:last-child::after": {
          display: "none",
        },
      },
    },
  },
}));

interface IProps {
  game: IGame;
  currentUserId: string;
  onActionClicked?: { (): void };
  actionMessage: string;
  waitingMessage?: string;
  showCopyLink?: boolean;
}

const useTournamentStyles = makeStyles({
  container: {
    // position: 'absolute',
    // top: '0',
    // left: '0',
    // right: '0',
    // bottom: '0',
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "stretch",
    flex: 1,
    "&>h1": {
      padding: "0 16px",
    },
  },
  facts: {
    display: "flex",
    flexWrap: "wrap",
    padding: "0 16px",
    alignItems: "center",
    justifyContent: "space-evenly",
    "& > a": {
      textDecoration: "none",
      color: "#fff",
      height: "20vw",
      width: "20vw",
      border: "1px solid white",
      borderRadius: "1vw",
      flexDirection: "column-reverse",
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      "& > h2": {
        fontSize: "7vw",
        marginTop: "-3vw",
        marginBottom: 0,
      },
      "& > h3": {
        position: "absolute",
        fontSize: "2vw",
        bottom: "2vw",
      },
    },
  },
});

function TournamentPlayer({ tournament }: { tournament: ITournamentDetails }) {
  const history = useHistory();
  const classes = useTournamentStyles();
  const [pageSize, setPageSize] = useState(150);
  const { id } = useParams<{ id: string }>();

  const { pushCrumb } = useBreadcrumbs();
  const { path, url } = useRouteMatch();

  const player = tournament.players[id];

  useEffect(() => pushCrumb({ path, url, name: player?.name || "Loading..." }), [player, path, url, pushCrumb]);

  const [actions, loading, error] = useCollection(
    firebase
      .firestore()
      .collection("tournaments")
      .doc(tournament.id)
      .collection("events")
      .where("uid", "==", player.id)
      .orderBy(firebase.firestore.FieldPath.documentId(), "desc")
      .limit(pageSize),
    {
      snapshotListenOptions: {},
    }
  );

  const columns: GridColumns = [
    { field: "method", headerName: "Method", width: 150 },
    {
      field: "params",
      headerName: "params",
      flex: 1,
      valueGetter: (params) => JSON.stringify(params.value),
    },
    { field: "timestamp", headerName: "Time", width: 250 },
    { field: "statusCode", headerName: "Status", width: 150 },
  ];
  // const onRowSelected = (params: RowSelectedParams) => {
  //   history.push(`/manage/tournaments/${tournament.id}/${params.data.id}`);
  // };
  const handlePageChange = React.useCallback((params: GridPageChangeParams) => {
    // debugger;
  }, []);

  const rows = actions
    ? actions.docs
      .map(
        (t: any) =>
          ({
            ...t.data(),
            id: t.id,
            timestamp: new Date(
              parseInt(t.id.split("-")[0], 10)
            ).toISOString(),
          } as any)
      )
      .slice(0, pageSize)
    : [];
  const rowCount = actions ? actions.docs.length : 0;

  return (
    <div className={classes.container}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        pageSize={pageSize}
        rowCount={rowCount}
        paginationMode="server"
        onPageChange={handlePageChange}
        loading={loading}
      // onRowSelected={onRowSelected}
      />
    </div>
  );
}

function TournamentPlayers({ tournament }: { tournament: ITournamentDetails }) {
  const history = useHistory();
  const classes = useTournamentStyles();
  const [pageSize, setPageSize] = useState(500);

  const { pushCrumb } = useBreadcrumbs();
  const { path, url } = useRouteMatch();

  useEffect(() => pushCrumb({ path, url, name: "Players" }), [path, url, pushCrumb]);

  const columns: GridColumns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "startDate", headerName: "Start Date", width: 250 },
    { field: "buyIn", headerName: "Buy-In ($)", width: 150 },
    { field: "startingStack", headerName: "Stack", width: 150 },
    { field: "registrationMode", headerName: "Registration", width: 150 },
    {
      field: "id",
      headerName: "ID",
      width: 150,
      disableClickEventBubbling: true,
      renderCell: (params: GridCellParams) => (
        <IconButton onClick={() => { }}>
          <EditIcon />
        </IconButton>
      ),
    },
  ];

  const onRowSelected = (params: GridRowSelectedParams) => {
    history.push(
      `/manage/tournaments/${tournament.id}/players/${params.data.id}`
    );
  };
  const handlePageChange = React.useCallback((params: GridPageChangeParams) => {
    // debugger;
  }, []);
  const data = Object.values(tournament.players);
  const rows = data.slice(0, pageSize);
  const rowCount = data.length;

  return (
    <div className={classes.container}>
      <Switch>
        <Route exact path={path}>
          <DataGrid
            rows={rows}
            columns={columns}
            pagination
            pageSize={pageSize}
            rowCount={rowCount}
            paginationMode="server"
            onPageChange={handlePageChange}
            loading={false}
            onRowSelected={onRowSelected}
          />
        </Route>
        <Route path={`${path}/:id`}>
          <TournamentPlayer tournament={tournament} />
        </Route>
      </Switch>
    </div>
  );
}

function TournamentTable({ tournament }: { tournament: ITournamentDetails }) {
  const history = useHistory();
  const classes = useTournamentStyles();
  const [pageSize, setPageSize] = useState(10);
  const { id } = useParams<{ id: string }>();

  const { pushCrumb } = useBreadcrumbs();
  const { path, url } = useRouteMatch();

  const tournamentTable = tournament.tableIdentifiers[id];

  useEffect(() => {
    if (tournamentTable) {
      return pushCrumb({
        path,
        url,
        name: tournamentTable?.name || "Loading...",
      });
    }
  }, [!!tournamentTable, path, url, pushCrumb]);

  const [hands, loading, error] = useCollection(
    firebase
      .firestore()
      .collection("tables")
      .doc(id)
      .collection("hands")
      .orderBy("id", "desc")
      .limit(pageSize),
    {
      snapshotListenOptions: {},
    }
  );
  const [table, loadingTable, errorTable] = useDocumentData(
    firebase.firestore().collection("tables").doc(id),
    {
      snapshotListenOptions: {},
    }
  );

  const columns: GridColumns = [
    {
      field: "id",
      headerName: "Time",
      width: 200,
      valueGetter: (params) => new Date(Number(params.value)).toLocaleTimeString(),
    },
    {
      field: "activeRound",
      headerName: "Round",
      width: 100,
    },
    {
      field: "dealerId",
      headerName: "Dealer",
      width: 180,
      valueGetter: (params) => tournament.players[String(params.value)].name,
    },
    {
      field: "actingPlayerId",
      headerName: "Action",
      width: 180,
      valueGetter: (params) => tournament.players[String(params.value)].name,
    },
    {
      field: "playerIds",
      headerName: "Players",
      flex: 1,
      valueGetter: (params) =>
        (params.value as string[])
          .map((x) => tournament.players[x].name)
          .join(", "),
    },
  ];
  // const onRowSelected = (params: RowSelectedParams) => {
  //   history.push(`/manage/tournaments/${tournament.id}/${params.data.id}`);
  // };
  const handlePageChange = React.useCallback((params: GridPageChangeParams) => {
    // debugger;
  }, []);

  console.log({ hands, loading, error });

  const rows = hands
    ? hands.docs
      .map(
        (t: any) =>
          ({
            ...t.data(),
            id: t.id,
            timestamp: new Date(
              parseInt(t.id.split("-")[0], 10)
            ).toISOString(),
          } as any)
      )
      .slice(0, pageSize)
    : [];
  const rowCount = hands ? hands.docs.length : 0;

  return (
    <div className={classes.container}>
      <DataGrid
        rows={rows}
        columns={columns}
        pagination
        pageSize={pageSize}
        rowCount={rowCount}
        paginationMode="server"
        onPageChange={handlePageChange}
        loading={loading}
      // onRowSelected={onRowSelected}
      />
    </div>
  );
}

function TournamentTables({ tournament }: { tournament: ITournamentDetails }) {
  const history = useHistory();
  const classes = useTournamentStyles();
  const [pageSize] = useState(500);
  const { pushCrumb } = useBreadcrumbs();
  const { path, url } = useRouteMatch();

  useEffect(() => pushCrumb({ path, url, name: "Tables" }), [path, url, pushCrumb]);

  const [stats, loading, error] = useCollection(
    firebase
      .firestore()
      .collection("tournaments")
      .doc(tournament.id)
      .collection("stats"),
    {
      snapshotListenOptions: {},
    }
  );
  console.log({ stats, loading, error });

  const columns: GridColumns = [
    { field: "name", headerName: "Name", width: 250 },
    {
      field: "stage",
      headerName: "Status",
      width: 100,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "activeHandId",
      headerName: "Active Hand",
      width: 200,
      align: "center",
      headerAlign: "center",
      valueGetter: (params: GridValueGetterParams) =>
        params.value
          ? new Date(Number(params.value)).toLocaleTimeString()
          : "-none-",
    },
    {
      field: "stats",
      headerName: "Stats",
      width: 200,
      align: "center",
      headerAlign: "center",
      valueGetter: (params: GridValueGetterParams) => {
        const tableStats = (params.value as any)?.data() as IGameStats;
        return tableStats ? `${tableStats.handCount}, ${tableStats.handDuration / 1000}s, $${tableStats.handAmount}/h `
          : "-none-";
      }
    },
    {
      field: "players",
      headerName: "Stack",
      flex: 1,
      renderCell: (params: GridCellParams) => (
        <div>
          {Object.values(tournament.players)
            .filter((p) => p.tableId === params.row.id)
            .map((p) => p.name)
            .join(",")}
        </div>
      ),
    },
  ];

  const onRowSelected = (params: GridRowSelectedParams) => {
    history.push(
      `/manage/tournaments/${tournament.id}/tables/${params.data.id}`
    );
  };
  const handlePageChange = React.useCallback((params: GridPageChangeParams) => {
    // debugger;
  }, []);
  const data = Object.values(tournament.tableIdentifiers || {}).map(table => {
    const stat = stats?.docs?.find((st: IGameStats) => st.id === table.id);
    console.log({ stat });
    return ({ ...table, stats: stat });
  });
  const rows = data.slice(0, pageSize);
  const rowCount = data.length;

  return (
    <div className={classes.container}>
      <Switch>
        <Route exact path={path}>
          <DataGrid
            rows={rows}
            columns={columns}
            pagination
            pageSize={pageSize}
            rowCount={rowCount}
            paginationMode="server"
            onPageChange={handlePageChange}
            loading={false}
            onRowSelected={onRowSelected}
          />
        </Route>
        <Route path={`${path}/:id`}>
          <TournamentTable tournament={tournament} />
        </Route>
      </Switch>
    </div>
  );
}

function Tournament() {
  const { id } = useParams<{ id: string }>();
  const { pushCrumb } = useBreadcrumbs();
  const { path, url } = useRouteMatch();

  const classes = useTournamentStyles();

  const [tournament, loading, error] = useDocumentData<ITournamentDetails>(
    firebase.firestore().collection("tournaments").doc(id),
    {
      snapshotListenOptions: {},
    }
  );

  useEffect(() => {
    if (tournament) {
      return pushCrumb({ path, url, name: tournament?.name || "Loading..." });
    }
  }, [path, url, pushCrumb, !!tournament]);

  return (
    <div className={classes.container}>
      {loading || error ? (
        <>{error}</>
      ) : (
        <Switch>
          <Route exact path={path}>
            <div className={classes.facts}>
              <Link to={`/manage/tournaments/${tournament.id}/players`}>
                <h3>Players</h3>
                <h2>{Object.values(tournament.players).length}</h2>
              </Link>
              <Link to={`/manage/tournaments/${tournament.id}/tables`}>
                <h3>Tables</h3>
                <h2>
                  {Object.values(tournament.tableIdentifiers || {}).length}
                </h2>
              </Link>
              <Link to={`/manage/tournaments/${tournament.id}/hands`}>
                <h3>Hands</h3>
                <h2>10</h2>
              </Link>
            </div>
          </Route>
          <Route path={`${path}/players`}>
            <TournamentPlayers tournament={tournament} />
          </Route>
          <Route path={`${path}/tables`}>
            <TournamentTables tournament={tournament} />
          </Route>
        </Switch>
      )}
    </div>
  );
}

function Tournaments() {
  const history = useHistory();
  const [
    selectedEditTournament,
    setSelectedEditTournament,
  ] = useState<ITournamentDetails>(null);
  const [pageSize, setPageSize] = useState(5);
  const { pushCrumb } = useBreadcrumbs();
  const { path, url } = useRouteMatch();

  useEffect(() => {
    console.log({ path, url, pushCrumb });
    return pushCrumb({ path, url, name: "Tournaments" });
  }, [path, url, pushCrumb]);

  const columns: GridColumns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "startDate", headerName: "Start Date", width: 250 },
    { field: "buyIn", headerName: "Buy-In ($)", width: 150 },
    { field: "startingStack", headerName: "Stack", width: 150 },
    { field: "registrationMode", headerName: "Registration", width: 150 },
    {
      field: "id",
      headerName: "ID",
      width: 150,
      disableClickEventBubbling: true,
      renderCell: (params: GridCellParams) => (
        <IconButton
          onClick={() => {
            setSelectedEditTournament(params.row as ITournamentDetails);
          }}
        >
          <EditIcon />
        </IconButton>
      ),
    },
  ];
  const [tournaments, loading, error] = useCollection(
    firebase
      .firestore()
      .collection("tournaments")
      // .where("organizerId", "==", firebase.auth().currentUser.uid)
      .where("organizerIds", "array-contains", firebase.auth().currentUser.uid)
      .orderBy("startDate", "desc")
      .limit(pageSize),
    {
      snapshotListenOptions: {},
    }
  );

  const onRowSelected = (params: GridRowSelectedParams) => {
    history.push(`/manage/tournaments/${params.data.id}`);
  };
  const handlePageChange = React.useCallback((params: GridPageChangeParams) => {
    // debugger;
  }, []);
  const rows = tournaments
    ? tournaments.docs.map((t: any) => t.data() as any).slice(0, pageSize)
    : [];
  const rowCount = tournaments ? tournaments.docs.length : 0;

  return (
    <>
      <Switch>
        <Route exact path={path}>
          <DataGrid
            rows={rows}
            columns={columns}
            pagination
            pageSize={pageSize}
            rowCount={rowCount}
            paginationMode="server"
            onPageChange={handlePageChange}
            loading={loading}
            onRowSelected={onRowSelected}
          />{" "}
        </Route>
        <Route path={`${path}/:id`}>
          <Tournament />
        </Route>
      </Switch>
      <EditTournamentDialog
        tournament={selectedEditTournament}
        onClose={async () => setSelectedEditTournament(null)}
      />
    </>
  );
}

function Tables() {
  const [pageSize, setPageSize] = useState(5);
  const columns: GridColumns = [
    { field: "name", headerName: "Name", flex: 1 },
    { field: "startDate", headerName: "Start Date", width: 250 },
    { field: "buyIn", headerName: "Buy-In ($)", width: 150 },
    { field: "startingStack", headerName: "Stack", width: 150 },
    { field: "registrationMode", headerName: "Registration", width: 150 },
  ];
  const [tables, loading, error] = useCollectionOnce(
    firebase
      .firestore()
      .collection("tables")
      .where("organizerId", "==", firebase.auth().currentUser.uid)
      .orderBy("startDate", "desc")
      .limit(pageSize),
    {
      getOptions: { source: "server" },
    }
  );
  const handlePageChange = React.useCallback((params: GridPageChangeParams) => {
    // debugger;
  }, []);
  const rows = tables
    ? tables.docs.map((t: any) => t.data() as any).slice(0, pageSize)
    : [];
  const rowCount = tables ? tables.docs.length : 0;
  console.log(tables?.docs, loading, error);
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      pagination
      pageSize={pageSize}
      rowCount={rowCount}
      paginationMode="server"
      onPageChange={handlePageChange}
      loading={loading}
      checkboxSelection
    />
  );
}

enum AdminPage {
  Home = "home",
  Tournaments = "tournaments",
  Tables = "tables",
  Settings = "settings",
}

interface IBreadcrumb {
  path: string;
  url: string;
  name: string;
  depth?: number;
}
interface IBreadcrumbContext {
  pushCrumb: { (crumb: IBreadcrumb): { (): void } };
  crumbs: IBreadcrumb[];
}

const BreadcrumbContext = React.createContext<IBreadcrumbContext>(null!);

interface IBreadcrumbProviderProps {
  children: React.ReactNode;
}
export function BreadcrumbProvider({ children }: IBreadcrumbProviderProps) {
  const [crumbs, setCrumbs] = useState<IBreadcrumb[]>([]);
  const crumbsRef = React.useRef(crumbs);
  crumbsRef.current = crumbs;
  const pushCrumb = React.useCallback((crumb: IBreadcrumb) => {
    // eslint-disable-next-line no-param-reassign
    crumb.depth = crumb.path.split("/").length;
    const index = crumbsRef.current.findIndex((x) => x.path === crumb.path);
    if (index >= 0 && crumbsRef.current[index].name === crumb.name) return;

    const updatedParts = (index >= 0
      ? crumbsRef.current.map((x) => (x.path === crumb.path ? crumb : x))
      : [...crumbsRef.current, crumb]
    ).sort((x1, x2) => x1.depth - x2.depth);

    setCrumbs(updatedParts);
    crumbsRef.current = updatedParts;
    console.log({ current: crumbsRef.current, updatedParts, crumb });
    return () => {
      console.log("remove", {
        crumb,
        current: crumbsRef.current,
        result: crumbsRef.current.filter((x) => x.path !== crumb.path),
      });
      setCrumbs(crumbsRef.current.filter((x) => x.path !== crumb.path));
    };
  }, []);
  return (
    <BreadcrumbContext.Provider
      value={{
        crumbs,
        pushCrumb,
      }}
    >
      {children}
    </BreadcrumbContext.Provider>
  );
}

function useBreadcrumbs() {
  const context = React.useContext(BreadcrumbContext);
  return context;
}

function Manage() {
  const classes = useStyles();
  const { pushCrumb, crumbs } = useBreadcrumbs();
  const { path, url } = useRouteMatch();

  useEffect(() => {
    console.log({ path, url, pushCrumb });
    return pushCrumb({ path, url, name: "Manage" });
  }, [path, url]);

  const history = useHistory();
  const route = (p: string, sp?: string) => {
    const routeParts = [p, sp].filter((x) => x);
    history.push(`/manage/${routeParts.join("/")}`);
  };
  const drawerItems = [
    // {
    //   title: "Home",
    //   callback: () => {
    //     route(AdminPage.Home);
    //     return true;
    //   },
    //   icon: <SupervisorAccountIcon />,
    // },
    {
      title: "Tournaments",
      callback: () => {
        route(AdminPage.Tournaments);
        return true;
      },
      icon: <SupervisorAccountIcon />,
    },
    {
      title: "Cash Games",
      callback: () => {
        route(AdminPage.Tables);
        return true;
      },
      icon: <SupervisorAccountIcon />,
    },
    {
      title: "Settings",
      callback: () => {
        route(AdminPage.Settings);
        return true;
      },
      icon: <SupervisorAccountIcon />,
    },
  ];
  return (
    <div className={`room-overlay ${classes.contentShift}`}>
      <Header drawerItems={drawerItems} showDrawer variant="persistent" />
      <div className={classes.content}>
        <h1 className="breadcrumbs">
          {crumbs.map((x) => (
            <Link to={x.url}>{x.name}</Link>
          ))}
        </h1>
        <Switch>
          <Route exact path={path}>
            <Tournaments />
          </Route>
          {/* <Route path={`${path}/${AdminPage.Home}`}>
            <Tournaments />
          </Route> */}
          <Route path={`${path}/${AdminPage.Tournaments}`}>
            <Tournaments />
          </Route>
          <Route path={`${path}/${AdminPage.Tables}`}>
            <Tables />
          </Route>
        </Switch>
      </div>
    </div>
  );
}

export default function ManageWithCrumbs() {
  return (
    <BreadcrumbProvider>
      <Manage />
    </BreadcrumbProvider>
  );
}
