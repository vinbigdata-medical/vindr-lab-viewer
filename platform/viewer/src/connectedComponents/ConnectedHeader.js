import Header from '../components/Header/index';
import { connect } from 'react-redux';

const mapStateToProps = state => {
  return {};
};

const ConnectedHeader = connect(mapStateToProps)(Header);

export default ConnectedHeader;
