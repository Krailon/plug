import { makeStyles } from '@material-ui/core/styles';
import { SHADOW_1 } from '@shared/styles/shadows';

export default makeStyles((theme) => ({
  ids: {
    width: '100%',
    background: '#F3F4F6',
    borderRadius: 10,
    padding: '9px 85px 9px 15px',
    wordBreak: 'break-all',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  id: {
    fontSize: 14,
    color: '#000000',
  },
  idInfoIcon: {
    position: 'absolute',
    right: 15,
    cursor: 'pointer',
  },
  modal: {
    height: 220,
    display: 'flex',
    justifyContent: 'space-evenly',
    padding: '0 20px',
    flexDirection: 'column',
    marginTop: -16,
  }
}));

