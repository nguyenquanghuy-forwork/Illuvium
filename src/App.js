import { Button, Col, Input, Layout, Row, Typography } from "antd";
import axios from "axios";
import React, { useEffect, useState } from "react";
import "./App.css";

const { Header, Content } = Layout;
const { Title } = Typography;

const App = () => {
  const calculateCurrentScores = (data) => {
    const uniqueAssets = new Set(
      data.map((item) => `${item.token_address}-${item.token_id}`)
    ).size; // Number of unique assets
    const totalIlluvials = new Set(data.map((item) => item.name)).size; // Unique Illuvials by name
    const holos = data
      .filter((item) => item.finish === "Holo" || item.finish === "DarkHolo")
      .reduce((acc, item) => acc + item.points, 0);
    const fullSets = 0; // Assuming no calculation for full sets based on provided information
    const total = data.reduce((acc, item) => acc + item.points, 0);

    return { sets: uniqueAssets, totalIlluvials, holos, fullSets, total };
  };

  const [data, setData] = useState([]);
  const [userAddress, setUserAddress] = useState("");
  const [collectionAddress, setCollectionAddress] = useState("");
  const [currentScores, setCurrentScores] = useState({
    sets: 0,
    totalIlluvials: 0,
    holos: 0,
    fullSets: 0,
    total: 0,
  });

  const fetchData = async () => {
    try {
      let allData = [];
      let cursor = "";
      const rateLimitPause = 200; // milliseconds to pause for rate limiting

      const pointsTable = {
        Holo: {
          T0S1: 20,
          T0S2: 100,
          T0S3: 500,
          T1S1: 75,
          T1S2: 375,
          T1S3: 1875,
          T2S1: 500,
          T2S2: 2500,
          T2S3: 12500,
          T3S1: 200,
          T3S2: 1500,
          T3S3: 7500,
          T4S1: 600,
          T4S2: 3000,
          T4S3: 15000,
          T5S1: 4000,
          T5S2: 20000,
          T5S3: 100000,
        },
        DarkHolo: {
          T0S1: 200,
          T0S2: 1000,
          T0S3: 5000,
          T1S1: 750,
          T1S2: 3750,
          T1S3: 18750,
          T2S1: 5000,
          T2S2: 25000,
          T2S3: 125000,
          T3S1: 3000,
          T3S2: 15000,
          T3S3: 75000,
          T4S1: 6000,
          T4S2: 30000,
          T4S3: 150000,
          T5S1: 40000,
          T5S2: 200000,
          T5S3: 1000000,
        },
      };

      while (true) {
        const response = await axios.get(
          `https://api.sandbox.x.immutable.com/v1/assets?page_size=300&order_by=updated_at&user=${userAddress}`
        );

        const results = response.data.result.map((item) => {
          const tier = item.metadata ? item.metadata["Tier"] : "";
          const stage = item.metadata ? item.metadata["Stage"] : "";
          const finish = item.metadata ? item.metadata["Finish"] : "";
          const tierStage = `T${tier}S${stage}`;

          const points =
            finish in pointsTable && tierStage in pointsTable[finish]
              ? pointsTable[finish][tierStage]
              : 0;

          return {
            ...item,
            metadata: JSON.stringify(item.metadata),
            collection: item.collection.name,
            icon_url: item.collection.icon_url,
            captured_by: item.metadata ? item.metadata["Captured By"] : "",
            tier: tier,
            stage: stage,
            finish: finish,
            points: points,
          };
        });

        allData = allData.concat(results);
        if (!response.data.cursor) break; // If no cursor, break the loop
        cursor = response.data.cursor;
        await new Promise((resolve) => setTimeout(resolve, rateLimitPause)); // Pause to respect API rate limit
      }

      setData(allData);
      const scores = calculateCurrentScores(allData);
      setCurrentScores(scores);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    if (userAddress && collectionAddress) {
      fetchData();
    }
  }, [userAddress, collectionAddress]);

  const handleRefresh = () => {
    fetchData();
  };

  const columns = [
    {
      title: "Token Address",
      dataIndex: "token_address",
      key: "token_address",
    },
    { title: "Token ID", dataIndex: "token_id", key: "token_id" },
    { title: "ID", dataIndex: "id", key: "id" },
    { title: "User", dataIndex: "user", key: "user" },
    { title: "Status", dataIndex: "status", key: "status" },
    { title: "URI", dataIndex: "uri", key: "uri" },
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Description", dataIndex: "description", key: "description" },
    { title: "Image URL", dataIndex: "image_url", key: "image_url" },
    { title: "Metadata", dataIndex: "metadata", key: "metadata" },
    { title: "Collection Name", dataIndex: "collection", key: "collection" },
    { title: "Collection Icon URL", dataIndex: "icon_url", key: "icon_url" },
    { title: "Created At", dataIndex: "created_at", key: "created_at" },
    { title: "Updated At", dataIndex: "updated_at", key: "updated_at" },
    { title: "Captured By", dataIndex: "captured_by", key: "captured_by" },
    { title: "Tier", dataIndex: "tier", key: "tier" },
    { title: "Stage", dataIndex: "stage", key: "stage" },
    { title: "Finish", dataIndex: "finish", key: "finish" },
    { title: "Points", dataIndex: "points", key: "points" },
  ];

  return (
    <Layout>
      <Header className="header">
        <Title level={2} style={{ color: "#fff" }}>
          Immutable X Data Fetcher
        </Title>
      </Header>
      <Content style={{ padding: "0 50px" }}>
        <div className="site-layout-content">
          <Row gutter={16} style={{ marginBottom: "20px" }}>
            <Col span={8}>
              <Input
                placeholder="Enter Wallet Address"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
              />
            </Col>
            <Col span={8}>
              <Button type="primary" onClick={handleRefresh}>
                Refresh
              </Button>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginBottom: "20px" }}>
            <Col span={4}>
              <div className="score-card">
                <div className="score-title">HOLOS</div>
                <div className="score-value">
                  {currentScores.holos.toLocaleString()}
                </div>
              </div>
            </Col>
            <Col span={4}>
              <div className="score-card">
                <div className="score-title">FULL SETS</div>
                <div className="score-value">{currentScores.fullSets}</div>
              </div>
            </Col>
            <Col span={4}>
              <div className="score-card">
                <div className="score-title">TOTAL</div>
                <div className="score-value">
                  {currentScores.total.toLocaleString()}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      </Content>
    </Layout>
  );
};

export default App;
