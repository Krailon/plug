import { makeStyles } from '@material-ui/core/styles';

export default makeStyles(() => ({
  detailsWrapper: {
    padding: '25px 25px 30px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  detailsImage: {
    content: '',
    width: '51px',
    height: '51px',
    borderRadius: '14px',
    backgroundColor: '#6B7280',
  },
  canisterId: {
    fontStyle: 'normal',
    fontWeight: 600,
    fontSize: 22,
    lineHeight: '36px',
    textAlign: 'center',
    margin: '10px 0 3px',
  },
  description: {
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: '20px',
    color: '#6B7280',
    margin: '0',
  },
  assetContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    margin: '25px 0 0',
    padding: '18px',
    boxSizing: 'border-box',
    border: '1px solid #D1D5DB',
    borderRadius: '10px',
  },
  amountTitle: {
    margin: '0px 0px 10px',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    fontWeight: 600,
    color: '#111827',
    fontSize: '22px',
    lineHeight: '20px',
  },
  amountDescription: {
    margin: 0,
    fontWeight: 500,
    fontSize: '16px',
    lineHeight: '20px',
    color: '#6B7280',
  },
  assetImg: {
    height: 56,
    width: 56,
    borderRadius: '100px',
  },
  warningBox: {
    width: '100%',
    marginTop: '30px',
    position: 'relative',
    padding: '16px 16px 16px 48px',
    background: '#FFFBEB',
    borderRadius: '6px',
  },
  warningTitle: {
    fontWeight: 500,
    fontSize: '15px',
    lineHeight: '20px',
    color: '#92400E',
    margin: '0px 0px 8px',
  },
  warningDescription: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '20px',
    color: '#B45309',
  },
  warningLink: {
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  warningLine: {
    color: '#B45309',
    marginTop: '20px',
  },
  yellowInfoIcon: {
    cursor: 'pointer',
    marginLeft: '8px',
  },
  yellowWarningIcon: {
    position: 'absolute',
    top: '18px',
    left: '18px',
  },
  emptyImg: {
    height: 56,
    width: 56,
    borderRadius: '14px',
    background: '#6B7280',
  },
  squareImg: {
    borderRadius: '14px !important',
  },
  yellowTitle: {
    color: '#EEAC00',
  },
}));
