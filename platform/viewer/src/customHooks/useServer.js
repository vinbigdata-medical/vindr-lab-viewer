import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
// Contexts
import AppContext from '../context/AppContext';

const getActiveServer = servers => {
  const isActive = a => a.active === true;

  return servers && servers.servers && servers.servers.find(isActive);
};

const isValidServer = (server, appConfig) => {
  return !!server;
};

export default function useServer({
  project,
  location,
  dataset,
  dicomStore,
} = {}) {
  const servers = useSelector(state => state && state.servers);
  const { appConfig = {} } = useContext(AppContext);
  const activeServer = getActiveServer(servers);
  if (isValidServer(activeServer, appConfig)) {
    return activeServer;
  }
}
