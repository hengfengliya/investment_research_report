import { Route, Routes } from "react-router-dom";
import MainLayout from "@layouts/MainLayout";
import HomeLanding from "@pages/home/HomeLanding";
import ThinkTankPage from "@pages/think-tank/ThinkTankPage";
import ChenxinAIPage from "@pages/ai/ChenxinAIPage";

/**
 * App 鏍圭粍浠讹細閰嶇疆棣栭〉 / 鏅哄簱 / AI 涓変釜璺敱
 */
const App = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomeLanding />} />
        <Route path="/think-tank" element={<ThinkTankPage />} />
        <Route path="/chenxin-ai" element={<ChenxinAIPage />} />
      </Route>
    </Routes>
  );
};

export default App;

