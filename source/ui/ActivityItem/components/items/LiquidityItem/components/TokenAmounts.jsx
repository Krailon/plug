import React from 'react';
import NumberFormat from 'react-number-format';

import { parseToFloatAmount, TOKENS } from '@shared/constants/currencies';

const TokenAmounts = ({ token0, token1 }) => {
  const parseTokenAmount = (token) => parseToFloatAmount(
    token.amount, token.token.details?.decimals || TOKENS[token.token?.details?.symbol]?.decimals,
  );
  const amount0 = parseTokenAmount(token0);
  const amount1 = parseTokenAmount(token1);
  const NumberWithMin = ({ value, ...props }) => (value < 0.01 ? `<0.01${props.suffix}` : <NumberFormat {...props} value={value} />);
  return (
    <>
      <NumberWithMin
        value={amount0}
        displayType="text"
        thousandSeparator=","
        suffix={` ${token0.token.details.symbol}`}
        decimalScale={3}
      />
      +
      <NumberWithMin
        value={amount1}
        displayType="text"
        thousandSeparator=","
        suffix={` ${token1.token.details.symbol}`}
        decimalScale={3}
      />
    </>
  );
};

export default TokenAmounts;
