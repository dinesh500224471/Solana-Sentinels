import { Router, Request, Response } from "express";

const router = Router();

/**
 * Solana Actions API endpoint for Blinks integration
 * This endpoint returns transaction metadata for verifying reputation
 */

// GET endpoint for action metadata
router.get("/api/actions/verify-reputation", (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    title: "Verify Sentinel Reputation",
    icon: "https://solana.com/branding/solanaLogoMark.svg",
    description: "Verify your Sentinel Identity reputation score on-chain",
    label: "Check Reputation",
    links: {
      actions: [
        {
          href: `${baseUrl}/api/actions/verify-reputation?identity={identity}&threshold={threshold}`,
          label: "Verify Threshold",
          parameters: [
            {
              name: "identity",
              label: "Identity Public Key",
              required: true,
            },
            {
              name: "threshold",
              label: "Minimum Reputation Score",
              required: true,
            },
          ],
        },
      ],
    },
  });
});

// POST endpoint for transaction building
router.post(
  "/api/actions/verify-reputation",
  (req: Request, res: Response) => {
    const { identity, threshold } = req.body;

    // Validate inputs
    if (!identity || !threshold) {
      return res.status(400).json({
        error: "Missing required parameters: identity, threshold",
      });
    }

    // Mock transaction response
    // In production, this would build an actual Solana transaction
    res.json({
      transaction: "base64-encoded-transaction-here",
      message: `Verifying reputation score >= ${threshold} for identity ${identity}`,
    });
  }
);

// GET endpoint for creating a Blink
router.get("/api/blinks/identity-card", (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  res.json({
    title: "Sentinel Identity Card",
    icon: "https://solana.com/branding/solanaLogoMark.svg",
    description: "Your Sentinel Identity and Reputation Profile",
    label: "View Identity",
    links: {
      actions: [
        {
          href: `${baseUrl}/api/actions/get-identity?owner={owner}`,
          label: "Get Identity Info",
          parameters: [
            {
              name: "owner",
              label: "Wallet Address",
              required: true,
            },
          ],
        },
      ],
    },
  });
});

// GET endpoint to retrieve identity information
router.get("/api/actions/get-identity", (req: Request, res: Response) => {
  const { owner } = req.query;

  if (!owner) {
    return res.status(400).json({ error: "Missing owner parameter" });
  }

  // Mock identity data
  res.json({
    owner: owner,
    identity_type: "Human",
    reputation_score: 150,
    activity_count: 5,
    total_payfi_volume: 50000,
    created_at: Math.floor(Date.now() / 1000),
    message: `Identity retrieved for ${owner}`,
  });
});

export default router;
