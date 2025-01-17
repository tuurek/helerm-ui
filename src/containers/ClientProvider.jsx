import React from 'react';
import PropTypes from 'prop-types';

import { getClient } from '../utils/oidcClient';

export const ClientContext = React.createContext(null);

const ClientProvider = ({ children }) => {
  const client = getClient();
  return <ClientContext.Provider value={{ client }}>{children}</ClientContext.Provider>;
};

ClientProvider.propTypes = {
  children: PropTypes.element,
};

export default ClientProvider;
