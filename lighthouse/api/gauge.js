const { parse } = require("url");

module.exports = (req, res) => {
  const { query } = parse(req.url, true);
  const score = parseFloat(query.score, 10) || null;

  let result;
  if (!score || score < 0.5) {
    result = "fail";
  } else if (score < 0.9) {
    result = "average";
  } else {
    result = "pass";
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink= "http://www.w3.org/1999/xlink" viewBox="0 0 120 120" class="lh-gauge ${result}" fill="none" stroke-width="2">
      <circle class="lh-gauge-base" r="53" cx="60" cy="60"></circle>
      <circle class="lh-gauge-arc" transform="rotate(-90 60 60)" stroke-dasharray="0 329" stroke-dashoffset="0" r="53" cx="60" cy="60"></circle>
      <style>
        svg {
          --average-color: hsl(31, 100%, 45%);
          --circle-background: hsl(216, 12%, 92%);
          --circle-border-width: 9;
          --circle-size: calc(3 * 20px);
          --fail-color: hsl(1, 73%, 45%);
          --pass-color: hsl(139, 70%, 30%);
          --transition-length: 1s;
        }

        .lh-gauge.average {
          --circle-color: var(--average-color);
          color: var(--circle-color);
        }

        .lh-gauge.fail {
          --circle-color: var(--fail-color);
          color: var(--circle-color);
        }

        .lh-gauge.pass {
          --circle-color: var(--pass-color);
          color: var(--circle-color);
        }

        .lh-gauge {
            max-width: 360px;
            max-height: 360px;
            stroke-linecap: round;
            width: var(--circle-size);
            height: var(--circle-size);
        }

        .lh-gauge-base {
            fill: none;
            stroke: var(--circle-background);
            stroke-width: var(--circle-border-width);
        }

        .lh-gauge-arc {
            fill: none;
            stroke: var(--circle-color);
            stroke-width: var(--circle-border-width);
            animation: load-gauge var(--transition-length) ease forwards;
            animation-delay: 250ms;
        }

        @keyframes load-gauge {
          from { stroke-dasharray: 0 329; }
          to { stroke-dasharray: ${score * 329} 329; }
        }
      </style>
    </svg>
  `;

  res.setHeader("Content-Type", "image/svg+xml");
  res.end(svg);
};
