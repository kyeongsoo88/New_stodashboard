"use client"

// Force refresh: Fix chart keys and XAxis labels


import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MetricCard } from "@/components/dashboard/metric-card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, Cell, Legend, PieChart, Pie, ReferenceLine } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ChevronDownIcon, ChevronUpIcon, ChevronRightIcon, LightbulbIcon, AlertTriangleIcon, TargetIcon, BarChart3Icon, TrendingUpIcon, BriefcaseIcon, WalletIcon, PencilIcon, SaveIcon, XIcon, TagIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Simple Tooltip Component
const SimpleTooltip = ({ text, children }: { text: string, children: React.ReactNode }) => {
  const [show, setShow] = React.useState(false);
  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-50 px-2 py-1 text-xs text-white bg-black rounded shadow-lg bottom-full left-1/2 transform -translate-x-1/2 mb-1 whitespace-nowrap pointer-events-none">
          {text}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      )}
    </div>
  );
};

// --- Mock Data Generator ---
// Helper to generate consistent random data for demo
const generateConsistentData = (seed: string, length: number, min: number, max: number) => {
    let data = [];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    
    for (let i = 0; i < length; i++) {
        const x = Math.sin(hash + i) * 10000;
        const rnd = x - Math.floor(x);
        data.push(Math.floor(rnd * (max - min)) + min);
    }
    return data;
};

// Generate YOY Data (Consistent)
const generateYoySeries = (label: string) => {
    const data = generateConsistentData(label, 11, 80, 160); // 80% ~ 160%
    return data.map((val, i) => ({ name: `${i+1}월`, yoy: val }));
};

// 퍼센트 값을 포맷팅하는 전역 헬퍼 함수 (소수점이 0이면 정수로 표시)
function formatPercentGlobal(val: string | number): string {
  if (val === null || val === undefined) return '';
  const valStr = typeof val === 'number' ? val.toString() : val;
  if (!valStr || valStr === '' || valStr === '-') return valStr;
  
  // 퍼센트 기호가 포함된 경우
  if (valStr.includes('%')) {
    const num = parseFloat(valStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return valStr;
    // 소수점이 0이면 정수로, 아니면 소수점 첫째 자리로 표시
    if (num % 1 === 0) {
      return `${num}%`;
    }
    return `${num.toFixed(1)}%`;
  }
  
  // 퍼센트가 없는 경우 그대로 반환
  return valStr;
}

// Moved TableCellStyled BEFORE Usage
function TableCellStyled({ children, className, type="default" }: { children: React.ReactNode, className?: string, type?: "diff" | "yoy" | "default" }) {
    let colorClass = "";
    if (typeof children === 'string') {
        if (type === 'diff') {
             colorClass = "text-emerald-600 font-medium";
             if (children.startsWith('-')) colorClass = "text-rose-500 font-medium";
        }
        if (type === 'yoy') {
            // className이 전달되면 자동 배경색 적용하지 않음
            if (!className || !className.includes('bg-')) {
                const num = parseFloat(children.replace(/[^0-9.-]/g, ''));
                if (num >= 100) colorClass = "bg-emerald-100 text-emerald-700 rounded px-1 py-0.5 inline-block text-xs font-bold";
                else colorClass = "bg-rose-100 text-rose-700 rounded px-1 py-0.5 inline-block text-xs font-bold";
            } else {
                // className에 배경색이 있으면 텍스트 색상만 적용
                colorClass = "font-medium";
            }
        }
    }
    return <TableCell className={cn("text-center p-2 text-xs", className, colorClass)}>{children}</TableCell>
}

function InsightBox({ title, children, color }: { title: string, children: React.ReactNode, color: "purple" | "blue" | "green" }) {
    const colorStyles = {
        purple: "bg-purple-50 text-purple-900",
        blue: "bg-blue-50 text-blue-900",
        green: "bg-green-50 text-green-900",
    };
    const titleColorStyles = {
        purple: "text-purple-700",
        blue: "text-blue-700",
        green: "text-green-700",
    };
  return (
        <div className={cn("p-3 rounded-md text-sm space-y-2", colorStyles[color])}>
            <h4 className={cn("font-bold text-base", titleColorStyles[color])}>{title}</h4>
            <div className="leading-relaxed text-gray-700">
                {children}
            </div>
        </div>
    )
}

// Editable CEO Insight Card
function EditableInsightCard({
    title,
    icon: Icon,
    defaultItems,
    storageKey,
    cardClassName,
    titleClassName
}: {
    title: string,
    icon: React.ElementType,
    defaultItems: string[],
    storageKey: string,
    cardClassName: string,
    titleClassName: string
}) {
    const [items, setItems] = React.useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return defaultItems;
                }
            }
        }
        return defaultItems;
    });
    const [isEditing, setIsEditing] = React.useState(false);
    const [editText, setEditText] = React.useState('');

    const startEdit = () => {
        setEditText(items.join('\n'));
        setIsEditing(true);
    };

    const saveEdit = () => {
        const newItems = editText.split('\n').filter(line => line.trim() !== '');
        setItems(newItems);
        if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, JSON.stringify(newItems));
        }
        setIsEditing(false);
    };

    const cancelEdit = () => {
        setEditText(items.join('\n'));
        setIsEditing(false);
    };

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    setItems(JSON.parse(saved));
                } catch {
                    // Ignore parse errors
                }
            }
        }
    }, [storageKey]);

    return (
        <Card className={cardClassName}>
            <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className={cn("font-bold text-base flex items-center gap-2", titleClassName)}>
                        <Icon className="h-5 w-5" />
                        {title}
                    </h3>
                    {!isEditing ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={startEdit}
                        >
                            <PencilIcon className="h-3 w-3" />
                        </Button>
                    ) : (
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                                onClick={saveEdit}
                            >
                                <SaveIcon className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                onClick={cancelEdit}
                            >
                                <XIcon className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>
                {!isEditing ? (
                    <ul className="text-base space-y-1 text-gray-700 list-none pl-0">
                        {items.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                ) : (
                    <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-base text-gray-700 p-2 border rounded resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="각 항목을 새 줄에 입력하세요..."
                    />
                )}
            </CardContent>
        </Card>
    );
}

// Detailed Metric Card with Expandable Sections
function DetailedMetricCard({
    title,
    value,
    yoy,
    yoyDesc,
    yoyAdditional,
    salesShare,
    profitMargin,
    operatingExpenseRatio,
    trend,
    channelDetails,
    itemDetails,
    channelProfitDetails,
    topStoresDetails,
    expenseBreakdown,
    commonExpenses,
    directProfitYtdDetails,
    directProfitPopupData,
    className,
    expandAll
}: {
    title: string,
    value: string,
    yoy: string,
    yoyDesc?: string,
    yoyAdditional?: string,
    salesShare?: string,
    profitMargin?: string,
    operatingExpenseRatio?: string,
    trend?: "up" | "down",
    channelDetails?: { name: string, value: string, yoy: string, percent: string }[],
    itemDetails?: { name: string, value: string, yoy: string, percent: string }[],
    channelProfitDetails?: { name: string, value: string, yoy: string, margin: string }[],
    topStoresDetails?: { name: string, value: string, yoy: string }[],
    expenseBreakdown?: { name: string, value?: string, yoy?: string, subItems?: { name: string, value?: string, yoy?: string }[] }[],
    commonExpenses?: { name: string, value: string, yoy: string }[],
    directProfitYtdDetails?: { name: string, value: string, percent: string, margin: string, change: string }[],
    directProfitPopupData?: DirectProfitPopupData | null,
    className?: string,
    expandAll?: boolean
}) {
    // 퍼센트 배지용 헬퍼: 100%는 100.0%로 표기
    const formatPercentBadge = (val: string): string => {
        if (!val) return val;
        const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
        if (!isNaN(num) && num === 100) {
            return `${num.toFixed(1)}%`;
        }
        return formatPercent(val);
    };
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isChannelExpanded, setIsChannelExpanded] = React.useState(false);
    const [isItemExpanded, setIsItemExpanded] = React.useState(false);
    const [isDirectProfitYtdExpanded, setIsDirectProfitYtdExpanded] = React.useState(false);
    const [isTopStoresExpanded, setIsTopStoresExpanded] = React.useState(false);
    
    // YoY 값에서 괄호 제거하는 헬퍼 함수 (전년을 YoY로 변환)
    const removeYoYParentheses = (yoyValue: string): string => {
      if (!yoyValue) return yoyValue;
      // "전년"을 "YoY"로 변경 후 괄호 제거
      let result = yoyValue.replace(/전년/g, 'YoY');
      return result.replace(/[()]/g, '');
    };
    
    // 퍼센트 값을 포맷팅하는 헬퍼 함수 (소수점이 0이면 정수로 표시)
    const formatPercent = (val: string): string => {
      if (!val) return val;
      // 퍼센트 기호가 포함된 경우
      if (val.includes('%')) {
        const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
        if (isNaN(num)) return val;
        // 소수점이 0이면 정수로, 아니면 소수점 첫째 자리로 표시
        if (num % 1 === 0) {
          return `${num}%`;
        }
        return `${num.toFixed(1)}%`;
      }
      // 퍼센트가 없는 경우 그대로 반환
      return val;
    };
    
    // 외부에서 expandAll prop이 변경되면 모든 상세보기를 제어
    React.useEffect(() => {
        if (expandAll !== undefined) {
            setIsChannelExpanded(expandAll);
            setIsItemExpanded(expandAll);
            setIsExpanded(expandAll);
            setIsDirectProfitYtdExpanded(expandAll);
            setIsTopStoresExpanded(expandAll);
        }
    }, [expandAll]);
    
    return (
        <Card className={cn("overflow-hidden shadow-sm", className)}>
            <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-black mb-0 leading-tight">{title}</CardTitle>
                    {trend === "up" && <ChevronUpIcon className="h-4 w-4 text-red-500" />}
                    {trend === "down" && <ChevronDownIcon className="h-4 w-4 text-blue-500" />}
                </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 -mt-1">
                <div className="text-3xl font-bold -mt-1 leading-tight">{title.includes("할인율") ? formatPercent(value) : value}</div>
                <div className="flex items-center gap-1.5 text-sm flex-wrap">
                    <span className={cn("font-bold px-2 py-0.5 rounded bg-emerald-100", (() => {
                        const yoyText = removeYoYParentheses(yoy);
                        const isExpenseCard = expenseBreakdown !== undefined || title.includes("영업비");
                        
                        // 음수 체크 (적자, 적자전환 등)
                        if (yoy.includes("-") || yoy.includes("적자")) {
                            return "text-red-600 bg-red-50";
                        }
                        // 퍼센트 값이 있는 경우
                        if (yoyText.includes("%")) {
                            const cleaned = yoyText.replace(/[^0-9.-]/g, '');
                            const yoyNum = parseFloat(cleaned);
                            if (!isNaN(yoyNum)) {
                                // 영업비 카드의 경우: 100 미만이면 좋은 것(초록색), 100 이상이면 나쁜 것(빨간색)
                                if (isExpenseCard) {
                                    if (yoyNum < 100) {
                                        return "text-emerald-700";
                                    } else {
                                        return "text-red-600";
                                    }
                                }
                                // 다른 카드의 경우: 기존 로직 (100 미만이면 빨간색, 100 이상이면 초록색)
                                if (yoyNum < 100) {
                                    return "text-red-600";
                                }
                            }
                        }
                        return "text-emerald-700";
                    })())}>
                        YoY {removeYoYParentheses(yoy)}
                    </span>
                    {title.includes("할인율") && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <button className="font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs hover:bg-purple-200 transition-colors ml-0 cursor-pointer border-0">
                                    CORE할인
                                </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>CORE 할인 상세</DialogTitle>
                                </DialogHeader>
                                <CoreDiscountDialog data={null} />
                            </DialogContent>
                        </Dialog>
                    )}
                    {yoyAdditional && (
                        <span className={cn("font-bold px-2 py-0.5 rounded text-emerald-700 bg-emerald-100")}>
                            {yoyAdditional}
                        </span>
                    )}
                    {salesShare && (
                        <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {salesShare}
                        </span>
                    )}
                    {profitMargin && (
                        <>
                            <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                                {profitMargin}
                            </span>
                            {title.includes("직접이익") && (
                                <>
                                    <span className="text-[11px] px-1 py-0.5 rounded font-bold text-red-600 bg-red-50 flex-shrink-0">
                                        이익율 전년대비
                                    </span>
                                    {directProfitPopupData && (
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="px-2 py-0.5 rounded font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 flex-shrink-0"
                                                >
                                                    US EC 직접이익 분석
                                                </button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-3xl">
                                                <DialogHeader>
                                                    <DialogTitle>직접이익 상세</DialogTitle>
                                                </DialogHeader>
                                                <DirectProfitPopupDialog data={directProfitPopupData} />
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </>
                            )}
                        </>
                    )}
                    {operatingExpenseRatio && (
                        <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {operatingExpenseRatio}
                        </span>
                    )}
                </div>
                
                {/* Expandable Details */}
                {(channelDetails || itemDetails || channelProfitDetails || topStoresDetails || expenseBreakdown || directProfitYtdDetails) && (
                    <div className="space-y-2">
                        {/* Channel Details - Separate Toggle */}
                        {(channelDetails || channelProfitDetails || expenseBreakdown) && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[11px] px-2 w-full justify-between"
                                    onClick={() => {
                                        if (channelDetails && itemDetails) {
                                            setIsChannelExpanded(!isChannelExpanded);
                                        } else {
                                            setIsExpanded(!isExpanded);
                                        }
                                    }}
                                >
                                    <span className="font-bold text-blue-700">
                                        {expenseBreakdown ? "영업비 상세보기" : 
                                         channelProfitDetails ? "채널별 직접이익[이익율]" : 
                                         "채널별 상세보기"}
                                    </span>
                                    {(channelDetails && itemDetails ? isChannelExpanded : isExpanded) ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                                </Button>
                                
                                {(channelDetails && itemDetails ? isChannelExpanded : isExpanded) && (
                                    <div className="border-t pt-2 space-y-3 text-xs">
                                        {channelDetails && !itemDetails && (
                                            <div className="space-y-1">
                                                {channelDetails.map((item, idx) => {
                                                    const yoyText = removeYoYParentheses(item.yoy);
                                                    let textColor = "text-emerald-700";
                                                    
                                                    // 할인율 카드의 경우: +면 빨간색, -면 초록색
                                                    if (title.includes("할인율")) {
                                                        if (yoyText.startsWith('+')) {
                                                            textColor = "text-red-600";
                                                        } else if (yoyText.startsWith('-')) {
                                                            textColor = "text-emerald-700";
                                                        }
                                                    } else {
                                                        // 기존 로직 (다른 카드들)
                                                        const isNegative = yoyText.startsWith('-');
                                                        if (isNegative) {
                                                            textColor = "text-red-600";
                                                        } else if (yoyText.includes("%")) {
                                                            const yoyNum = parseFloat(yoyText.replace(/[^0-9.-]/g, ''));
                                                            if (!isNaN(yoyNum) && yoyNum < 100) {
                                                                textColor = "text-red-600";
                                                            }
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <div key={idx} className="flex justify-between items-center py-0.5">
                                                            <span className="text-xs min-w-[70px]">{item.name}</span>
                                                            <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '160px' }}>
                                                                <span className="font-medium text-xs w-[100px] text-right tabular-nums">{title.includes("할인율") ? formatPercent(item.value) : item.value}</span>
                                                                <span className={cn("text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 min-w-[70px] text-center", "bg-emerald-100", textColor)}>{yoyText}</span>
                                                                {item.percent && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium w-[50px] text-center flex-shrink-0">{formatPercentBadge(item.percent)}</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {channelDetails && itemDetails && (
                                            <div className="space-y-1">
                                                {channelDetails.map((item, idx) => {
                                                    const yoyText = removeYoYParentheses(item.yoy);
                                                    let textColor = "text-emerald-700";
                                                    
                                                    // 할인율 카드의 경우: +면 빨간색, -면 초록색
                                                    if (title.includes("할인율")) {
                                                        if (yoyText.startsWith('+')) {
                                                            textColor = "text-red-600";
                                                        } else if (yoyText.startsWith('-')) {
                                                            textColor = "text-emerald-700";
                                                        }
                                                    } else {
                                                        // 기존 로직 (다른 카드들)
                                                        const isNegative = yoyText.startsWith('-');
                                                        if (isNegative) {
                                                            textColor = "text-red-600";
                                                        } else if (yoyText.includes("%")) {
                                                            const yoyNum = parseFloat(yoyText.replace(/[^0-9.-]/g, ''));
                                                            if (!isNaN(yoyNum) && yoyNum < 100) {
                                                                textColor = "text-red-600";
                                                            }
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <div key={idx} className="flex justify-between items-center py-0.5">
                                                            <span className="text-xs min-w-[70px]">{item.name}</span>
                                                            <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '160px' }}>
                                                                <span className="font-medium text-xs w-[100px] text-right tabular-nums">{title.includes("할인율") ? formatPercent(item.value) : item.value}</span>
                                                                <span className={cn("text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 min-w-[70px] text-center", "bg-emerald-100", textColor)}>{yoyText}</span>
                                                                {item.percent && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium w-[50px] text-center flex-shrink-0">{formatPercentBadge(item.percent)}</span>}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {channelProfitDetails && (
                                    <div className="space-y-2">
                                        <div className="space-y-1">
                                            {channelProfitDetails.map((item, idx) => {
                                                const yoyText = removeYoYParentheses(item.yoy);
                                                const isNegative = yoyText.startsWith('-');
                                                return (
                                                    <div key={idx} className="flex justify-between items-center py-0.5">
                                                        <span className="text-xs min-w-[70px]">{item.name}</span>
                                                        <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '160px' }}>
                                                            <span className="font-medium text-xs w-[100px] text-right tabular-nums">{item.value}</span>
                                                            <span className={cn("text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 min-w-[70px] text-center", "bg-emerald-100", isNegative ? "text-red-600" : "text-emerald-700")}>{yoyText}</span>
                                                            {item.margin && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium w-[50px] text-center flex-shrink-0">{formatPercent(item.margin)}</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {expenseBreakdown && (
                                    <div className="space-y-2">
                                        <div className="space-y-2">
                                            {expenseBreakdown.map((item, idx) => {
                                                // 비용 YoY 색상 결정: 100% 미만이면 초록색(좋음), 100% 이상이면 빨간색(나쁨)
                                                const getExpenseYoyColor = (yoyValue: string) => {
                                                    const yoyText = removeYoYParentheses(yoyValue);
                                                    if (yoyText.includes("%")) {
                                                        const cleaned = yoyText.replace(/[^0-9.-]/g, '');
                                                        const yoyNum = parseFloat(cleaned);
                                                        if (!isNaN(yoyNum)) {
                                                            // 100% 미만이면 초록색, 100% 이상이면 빨간색
                                                            return yoyNum < 100 ? "text-green-600" : "text-red-500";
                                                        }
                                                    }
                                                    return "text-emerald-700"; // 기본값
                                                };
                                                
                                                return (
                                                    <div key={idx}>
                                                        <div className="flex justify-between items-center py-0.5">
                                                            <span className="text-xs min-w-[80px]">{item.name}</span>
                                                            <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '140px' }}>
                                                                {item.value && <span className="font-medium text-xs w-[100px] text-right tabular-nums">{item.value}</span>}
                                                                {item.yoy && <span className={cn("text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 min-w-[70px] text-center", "bg-emerald-100", getExpenseYoyColor(item.yoy))}>{removeYoYParentheses(item.yoy)}</span>}
                                                            </div>
                                                        </div>
                                                        {item.subItems && (
                                                            <div className="space-y-1 pl-4">
                                                                {item.subItems.map((subItem: any, subIdx: number) => (
                                                                    <div key={subIdx} className="flex justify-between items-center py-1">
                                                                        <span className="text-xs min-w-[80px]">ㄴ {subItem.name}</span>
                                                                        <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '140px' }}>
                                                                            {subItem.value && <span className="font-medium text-xs w-[100px] text-right tabular-nums">{subItem.value}</span>}
                                                                            {subItem.yoy && <span className={cn("text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 min-w-[70px] text-center", "bg-emerald-100", getExpenseYoyColor(subItem.yoy))}>{removeYoYParentheses(subItem.yoy)}</span>}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* Direct Profit YTD Details - Separate Toggle */}
                        {directProfitYtdDetails && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[11px] px-2 w-full justify-between"
                                    onClick={() => setIsDirectProfitYtdExpanded(!isDirectProfitYtdExpanded)}
                                >
                                    <span className="font-bold text-blue-700">직접이익 YTD 상세보기</span>
                                    {isDirectProfitYtdExpanded ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                                </Button>
                                
                                {isDirectProfitYtdExpanded && (
                                    <div className="border-t pt-2 space-y-1 text-xs">
                                        {directProfitYtdDetails.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between py-0.5">
                                                <span className="text-[11px] flex-shrink-0 tracking-tight mr-1">{item.name}</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium text-[11px] w-[40px] text-right tabular-nums flex-shrink-0">{item.value}</span>
                                                    {item.percent && <span className="text-[11px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold w-[45px] text-center tabular-nums flex-shrink-0">{formatPercentBadge(item.percent.replace(/[\[\]]/g, ''))}</span>}
                                                    {item.margin && <span className="text-[11px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-medium w-[45px] text-center tabular-nums flex-shrink-0">{item.margin}</span>}
                                                    {item.change && <span className="text-[11px] px-1 py-0.5 rounded font-bold text-red-600 bg-red-50 flex-shrink-0 w-[60px] text-center tabular-nums">{item.change.replace(/\+\+/g, '+')}</span>}
        </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Top Stores Details (or Item Top 5) - Separate Toggle */}
                        {topStoresDetails && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[11px] px-2 w-full justify-between"
                                    onClick={() => setIsTopStoresExpanded(!isTopStoresExpanded)}
                                >
                                    <span className="font-bold text-blue-700">
                                        {title.includes("M/U") ? "아이템별 TOP 5(TAG 발주액 기준)" : "TOP 5 매장"}
                                    </span>
                                    {isTopStoresExpanded ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                                </Button>
                                
                                {isTopStoresExpanded && (
                                    <div className="border-t pt-2 space-y-1 text-xs">
                                        {topStoresDetails.map((item, idx) => {
                                          // 기말재고, 인원수 카드에서는 "전년"을 "YoY"로 변경, 그 외(M/U 등)는 그대로 "전년" 유지
                                          const shouldConvertToYoY = title.includes("기말재고") || title.includes("인원수");
                                          const yoyDisplay = shouldConvertToYoY && item.yoy && item.yoy.includes("전년")
                                            ? item.yoy.replace(/전년/g, 'YoY')
                                            : item.yoy;
                                          
                                          return (
                                            <div key={idx} className="flex justify-between items-center py-0.5">
                                                <span className="text-[11px] min-w-[60px]">{item.name}</span>
                                                <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '120px' }}>
                                                    <span className="font-bold text-[11px] w-[60px] text-right tabular-nums">{item.value}</span>
                                                    <span className="text-[11px] text-gray-500 min-w-[60px] text-right">{yoyDisplay}</span>
                                                </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* Item Details - Separate Toggle (Only when both channelDetails and itemDetails exist) */}
                        {channelDetails && itemDetails && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[11px] px-2 w-full justify-between"
                                    onClick={() => setIsItemExpanded(!isItemExpanded)}
                                >
                                    <span className="font-bold text-blue-700">{title.includes("할인율") ? "US EC 할인율 상세보기" : "아이템별 상세보기"}</span>
                                    {isItemExpanded ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                                </Button>
                                
                                {isItemExpanded && (
                                    <div className="border-t pt-2 space-y-1 text-xs">
                                        {itemDetails.map((item, idx) => {
                                            const yoyText = removeYoYParentheses(item.yoy);
                                            let textColor = "text-emerald-700";
                                            
                                            // 할인율 카드의 경우: +면 빨간색, -면 초록색
                                            if (title.includes("할인율")) {
                                                if (yoyText.startsWith('+')) {
                                                    textColor = "text-red-600";
                                                } else if (yoyText.startsWith('-')) {
                                                    textColor = "text-emerald-700";
                                                }
                                            } else {
                                                // 기존 로직 (다른 카드들)
                                                const isNegative = yoyText.startsWith('-');
                                                if (isNegative) {
                                                    textColor = "text-red-600";
                                                } else if (yoyText.includes("%")) {
                                                    const yoyNum = parseFloat(yoyText.replace(/[^0-9.-]/g, ''));
                                                    if (!isNaN(yoyNum) && yoyNum < 100) {
                                                        textColor = "text-red-600";
                                                    }
                                                }
                                            }
                                            
                                            return (
                                                <div key={idx} className="flex justify-between items-center py-0.5">
                                                    <span className="text-xs min-w-[70px]">{item.name}</span>
                                                    <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '160px' }}>
                                                        <span className="font-medium text-xs w-[100px] text-right tabular-nums">{title.includes("할인율") ? formatPercent(item.value) : item.value}</span>
                                                        <span className={cn("text-xs px-2 py-0.5 rounded font-bold flex-shrink-0 min-w-[70px] text-center", "bg-emerald-100", textColor)}>{yoyText}</span>
                                                        {item.percent && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium w-[50px] text-center flex-shrink-0">{formatPercentBadge(item.percent)}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                        
                        {/* Other details (when only itemDetails exists without channelDetails) */}
                        {itemDetails && !channelDetails && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-7 text-[11px] px-2 w-full justify-between"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                >
                                    <span className="font-bold text-blue-700">아이템별 상세보기</span>
                                    {isExpanded ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
                                </Button>
                                
                                {isExpanded && (
                                    <div className="border-t pt-2 space-y-1 text-xs">
                                        {itemDetails.map((item, idx) => {
                                            const yoyText = removeYoYParentheses(item.yoy);
                                            let textColor = "text-emerald-700";
                                            
                                            // 할인율 카드의 경우: +면 빨간색, -면 초록색
                                            if (title.includes("할인율")) {
                                                if (yoyText.startsWith('+')) {
                                                    textColor = "text-red-600";
                                                } else if (yoyText.startsWith('-')) {
                                                    textColor = "text-emerald-700";
                                                }
                                            } else {
                                                // 기존 로직 (다른 카드들)
                                                const isNegative = yoyText.startsWith('-');
                                                if (isNegative) {
                                                    textColor = "text-red-600";
                                                } else if (yoyText.includes("%")) {
                                                    const yoyNum = parseFloat(yoyText.replace(/[^0-9.-]/g, ''));
                                                    if (!isNaN(yoyNum) && yoyNum < 100) {
                                                        textColor = "text-red-600";
                                                    }
                                                }
                                            }
                                            
                                            return (
                                                <div key={idx} className="flex justify-between items-center py-0.5">
                                                    <span className="text-[11px] min-w-[60px]">{item.name}</span>
                                                    <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '140px' }}>
                                                        <span className="font-medium text-[11px] w-[90px] text-right tabular-nums">{title.includes("할인율") ? formatPercent(item.value) : item.value}</span>
                                                        <span className={cn("text-[11px] px-2 py-0.5 rounded font-bold flex-shrink-0 min-w-[60px] text-center", "bg-emerald-100", textColor)}>{yoyText}</span>
                                                        {item.percent && <span className="text-[11px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium w-[45px] text-center flex-shrink-0">{formatPercentBadge(item.percent)}</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
                
            </CardContent>
        </Card>
    )
}

type DirectProfitPopupData = {
  title: string;
  columns: Array<{
    key: string;
    amount: string;
    percent: string;
    segments: Array<{ label: string; percent: string }>;
  }>;
};

function parseDirectProfitPopupCSV(csvText: string): DirectProfitPopupData | null {
  const lines = csvText
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    // Excel에서 탭 구분/라인 전체 따옴표 저장 케이스 방어
    .map((line) => {
      let t = line.trim();
      if (t.includes('\t')) {
        t = t.replace(/\t/g, ',');
      }
      if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
        t = t.slice(1, -1).replace(/""/g, '"');
      }
      return t;
    })
    .filter(Boolean);
  if (lines.length < 2) return null;

  const headers = parseCSVLine(lines[0]).map(h => (h || '').replace(/^\uFEFF/, '').trim());
  const typeIdx = headers.findIndex(h => h === 'type');
  const columnIdx = headers.findIndex(h => h === 'column');
  const labelIdx = headers.findIndex(h => h === 'label');
  const valueIdx = headers.findIndex(h => h === 'value');

  if (typeIdx < 0 || valueIdx < 0) return null;

  let title = 'Tag매출대비 백분율 기준 PL';
  const columnOrder: string[] = [];
  const columns: Record<string, { key: string; amount: string; percent: string; segments: Array<{ label: string; percent: string }> }> = {};

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const type = (values[typeIdx] || '').replace(/^\uFEFF/, '').trim();
    const column = columnIdx >= 0 ? (values[columnIdx] || '').trim() : '';
    const label = labelIdx >= 0 ? (values[labelIdx] || '').trim() : '';
    const value = (values[valueIdx] || '').trim();

    if (!type) continue;

    if (type === 'title') {
      if (value) title = value;
      continue;
    }

    if (!column) continue;

    if (!columns[column]) {
      columns[column] = { key: column, amount: '', percent: '', segments: [] };
      columnOrder.push(column);
    }

    if (type === 'column') {
      if (label === 'amount') {
        columns[column].amount = value;
      } else if (label === 'percent') {
        columns[column].percent = value;
      }
    }

    if (type === 'segment' && label) {
      columns[column].segments.push({ label, percent: value });
    }
  }

  return {
    title,
    columns: columnOrder.map(key => columns[key]).filter(Boolean)
  };
}

function DirectProfitPopupDialog({ data }: { data: DirectProfitPopupData | null }) {
  if (!data) {
    return <div>데이터를 불러오는 중...</div>;
  }

  const parsePercent = (val: string) => {
    const num = parseFloat((val || '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(num) ? num : 0;
  };

  const segmentClass = (label: string) => {
    if (label === '할인') return "bg-gray-400 text-gray-900";
    if (label === '원가') return "bg-gray-600 text-white";
    if (label === '직접비') return "bg-slate-700 text-white";
    return "bg-gray-300 text-gray-900";
  };

  const baseStyles = (key: string) => {
    if (key === '택매출') return { bar: "bg-blue-600", text: "text-blue-700" };
    if (key === '실판매출') return { bar: "bg-blue-500", text: "text-blue-700" };
    if (key === '총이익') return { bar: "bg-emerald-600", text: "text-emerald-600" };
    if (key === '직접이익') return { bar: "bg-emerald-500", text: "text-emerald-600" };
    return { bar: "bg-blue-600", text: "text-blue-700" };
  };

  return (
    <div className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
        <span className="text-base">🍊</span>
        <span>{data.title}</span>
      </div>
      <div className="flex items-end justify-between gap-6">
        {data.columns.map(col => {
          const columnPercent = parsePercent(col.percent);
          const { bar, text } = baseStyles(col.key);
          const segments = col.segments;
          return (
            <div key={col.key} className="flex flex-col items-center gap-2">
              <div className={cn("text-sm font-bold", text)}>{col.amount}</div>
              <div className="h-[220px] w-[90px] rounded-t-2xl overflow-hidden shadow-sm flex flex-col">
                {segments.map((seg, idx) => {
                  const segPercent = parsePercent(seg.percent);
                  return (
                    <div
                      key={`${seg.label}-${idx}`}
                      className={cn("flex items-center justify-center text-xs font-bold px-1 text-center", segmentClass(seg.label))}
                      style={{ flex: segPercent }}
                    >
                      <span>{seg.label} {seg.percent}</span>
                    </div>
                  );
                })}
                <div
                  className={cn("flex items-center justify-center font-bold text-white text-lg", bar)}
                  style={{ flex: columnPercent }}
                >
                  {col.percent}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-slate-800">{col.key}</div>
                <div className={cn("text-sm font-bold", text)}>{col.percent}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// US/EU 건당 운반비 단가 팝업 컴포넌트
function ShippingCostDialog({ data }: { data: any }) {
    if (!data) {
        return <div>데이터를 불러오는 중...</div>;
    }
    
    const { chartData } = data;

    return (
        <div className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-slate-800">US/EU 건당 운반비 / EU 고객 부담 %</h3>
            </div>
            
            <div className="h-[400px] bg-white p-4 rounded-lg shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis yAxisId="left" domain={[0, 30]} stroke="#6b7280" label={{ value: '$', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 90]} stroke="#6b7280" label={{ value: '%', angle: 90, position: 'insideRight' }} />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value: number, name: string) => {
                                if (name === 'EU 고객 부담%') {
                                    return [`${value.toFixed(1)}%`, name];
                                }
                                return [`$${value.toFixed(2)}`, name];
                            }}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="usCost" stroke="#000000" strokeWidth={2} dot={{ r: 4, fill: "#000000" }} name="US 건당 운반비 단가" />
                        <Line yAxisId="left" type="monotone" dataKey="euCost" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} name="EU 건당 운반비 단가" />
                        <Line yAxisId="right" type="monotone" dataKey="euBurden" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} name="EU 고객 부담%" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
                <h4 className="text-sm font-bold mb-3 text-slate-800">채널</h4>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">채널</TableHead>
                            <TableHead className="text-center">3월</TableHead>
                            <TableHead className="text-center">4월</TableHead>
                            <TableHead className="text-center">5월</TableHead>
                            <TableHead className="text-center">6월</TableHead>
                            <TableHead className="text-center">7월</TableHead>
                            <TableHead className="text-center">8월</TableHead>
                            <TableHead className="text-center">9월</TableHead>
                            <TableHead className="text-center">10월</TableHead>
                            <TableHead className="text-center">11월</TableHead>
                            <TableHead className="text-center">12월</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="font-medium">US 건당 운반비 단가</TableCell>
                            {chartData.map((d: any) => (
                                <TableCell key={d.month} className="text-center">${d.usCost.toFixed(2)}</TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">EU 건당 운반비 단가</TableCell>
                            {chartData.map((d: any) => (
                                <TableCell key={d.month} className="text-center">${d.euCost.toFixed(2)}</TableCell>
                            ))}
                        </TableRow>
                        <TableRow>
                            <TableCell className="font-medium">EU 고객 부담%</TableCell>
                            {chartData.map((d: any) => (
                                <TableCell key={d.month} className="text-center">{d.euBurden.toFixed(1)}%</TableCell>
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

// SEM광고비 분석 팝업 컴포넌트
function SEMAdAnalysisDialog({ data }: { data: any }) {
    if (!data) {
        return <div>데이터를 불러오는 중...</div>;
    }
    
    const { chartData, textData, cumulative } = data;

    return (
        <div className="space-y-4 bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-slate-800">US EC SEM광고비 분석</h3>
                <div className="space-y-2 text-sm">
                    <div className="font-bold text-blue-700 bg-blue-100 px-3 py-2 rounded-md inline-block">{textData.yoyText}</div>
                    <div className="text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                        {textData.desc1}
                    </div>
                    <div className="text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                        {textData.desc2}
                    </div>
                </div>
            </div>
            
            <div className="h-[300px] bg-white p-4 rounded-lg shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis yAxisId="left" domain={[0, 1800]} stroke="#6b7280" />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 28]} stroke="#6b7280" />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: 'white', 
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }} 
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar yAxisId="left" dataKey="sales" fill="#60a5fa" name="US EC 매출" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="adSpend" fill="#fbbf24" name="SEM광고비" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="ratio2025" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} name="25년 광고비율 (%)" />
                        <Line yAxisId="right" type="monotone" dataKey="ratio2024" stroke="#a855f7" strokeWidth={2} dot={{ r: 4, fill: "#a855f7" }} name="24년 광고비율 (%)" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300 shadow-md">
                    <CardContent className="p-4">
                        <div className="text-xs text-blue-800 mb-1 font-medium">누적 US EC 매출</div>
                        <div className="text-lg font-bold text-blue-900">$19,502K</div>
                        <div className="text-xs text-blue-700 mt-1">누적 기준 YoY 128%</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 shadow-md">
                    <CardContent className="p-4">
                        <div className="text-xs text-orange-800 mb-1 font-medium">누적 SEM비용</div>
                        <div className="text-lg font-bold text-orange-900">${cumulative.adSpend.toLocaleString()}K</div>
                        <div className="text-xs text-orange-700 mt-1">누적 기준 SEM YoY 127%</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-pink-100 to-pink-200 border-pink-300 shadow-md">
                    <CardContent className="p-4">
                        <div className="text-xs text-pink-800 mb-1 font-medium">평균 광고비율</div>
                        <div className="text-lg font-bold text-pink-900">20.5%</div>
                        <div className="text-xs text-pink-700 mt-1">(전년대비 : -0.1%p)</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Detailed Expense Card Component
function DetailedExpenseCard({ 
    title, 
    value, 
    yoy, 
    yoyDiff, 
    details, 
    showToggle,
    period,
    onPeriodChange,
    className,
    showDetailButton,
    semPopupData,
    showShippingButton,
    shippingPopupData
}: { 
    title: string, 
    value: string, 
    yoy: string, 
    yoyDiff: string, 
    details: React.ReactNode,
    showToggle?: boolean,
    period?: "누적" | "당월",
    onPeriodChange?: (period: "누적" | "당월") => void,
    className?: string,
    showDetailButton?: boolean,
    semPopupData?: any,
    showShippingButton?: boolean,
    shippingPopupData?: any
}) {
    const yoyNum = parseFloat(yoy.replace(/[^0-9.-]/g, ''));
    // 비용 카드이므로 100% 초과하면 붉은색(나쁨), 100% 이하면 초록색(좋음)
    const yoyColor = yoyNum > 100 ? "text-red-500" : "text-green-600";
    const diffColor = "text-gray-500";
    
    return (
        <Card className={cn("overflow-hidden shadow-sm gap-2", className)}>
            <CardHeader className="px-6 pt-2 pb-0 min-h-[36px] gap-1">
                <CardTitle className="text-base font-medium text-muted-foreground flex items-center justify-between">
                    <span>{title}</span>
                    <div className="flex items-center gap-2">
                        {showDetailButton && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-6 text-xs px-2 bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300">
                                        상세
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle>US EC SEM광고비 분석</DialogTitle>
                                    </DialogHeader>
                                    <SEMAdAnalysisDialog data={semPopupData} />
                                </DialogContent>
                            </Dialog>
                        )}
                        {showToggle && period && onPeriodChange ? (
                            <div className="flex gap-1">
                                <Button 
                                    variant={period === "누적" ? "default" : "outline"} 
                                    size="sm" 
                                    className={cn("h-6 text-xs px-2", period === "누적" ? "bg-slate-800 hover:bg-slate-900" : "")}
                                    onClick={() => onPeriodChange("누적")}
                                >
                                    누적
                                </Button>
                                <Button 
                                    variant={period === "당월" ? "default" : "outline"} 
                                    size="sm" 
                                    className={cn("h-6 text-xs px-2", period === "당월" ? "bg-slate-800 hover:bg-slate-900" : "")}
                                    onClick={() => onPeriodChange("당월")}
                                >
                                    당월
                                </Button>
                            </div>
                        ) : period && (
                            <span className="text-xs text-gray-500 font-medium">{period}</span>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-1">
                <div className="text-2xl font-bold tabular-nums w-full">{value}</div>
                <div className="flex items-center gap-2 text-sm">
                    <span className={cn("font-bold", yoyColor)}>YoY {yoy}</span>
                    <span className={cn("text-sm", diffColor)}>({yoyDiff})</span>
                </div>
                <div className="text-sm space-y-1 text-gray-600">
                    {details}
                </div>
                {showShippingButton && (
                    <div className="pt-2 border-t">
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 text-xs px-2 w-full bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300">
                                    US/EU건당 운반비 단가
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>US/EU 건당 운반비 단가</DialogTitle>
                                </DialogHeader>
                                <ShippingCostDialog data={shippingPopupData} />
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Expense Summary Section Component
function ExpenseSummarySection({
    title,
    iconColor,
    cards,
    defaultPeriod = "누적",
    semPopupData,
    shippingPopupData
}: {
    title: string,
    iconColor: string,
    cards: Array<{
        title: string,
        value: { 누적: string, 당월: string },
        yoy: { 누적: string, 당월: string },
        yoyDiff: { 누적: string, 당월: string },
        details: { 누적: React.ReactNode, 당월: React.ReactNode }
    }>,
    defaultPeriod?: "누적" | "당월",
    semPopupData?: any,
    shippingPopupData?: any
}) {
    const [period, setPeriod] = React.useState<"누적" | "당월">(defaultPeriod);
    
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", iconColor)}></div>
                <h3 className="font-bold text-2xl">{title}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {cards.map((card, index) => (
                    <DetailedExpenseCard
                        key={card.title}
                        title={card.title}
                        value={card.value[period]}
                        yoy={card.yoy[period]}
                        yoyDiff={card.yoyDiff[period]}
                        details={card.details[period]}
                        showToggle={index === 0}
                        period={period}
                        onPeriodChange={setPeriod}
                        showDetailButton={card.title === "SEM광고비"}
                        semPopupData={card.title === "SEM광고비" ? semPopupData : undefined}
                        showShippingButton={card.title === "운반비"}
                        shippingPopupData={card.title === "운반비" ? shippingPopupData : undefined}
                        className={
                            index === 0 && title === "직접비 요약" ? "bg-purple-100" :
                            index === 0 && title === "영업비 요약" ? "bg-orange-100" :
                            undefined
                        }
                    />
                ))}
            </div>
        </div>
    )
}

// 25SS 재고소진 계획 팝업 컴포넌트
function InventoryPlanDialog({ data }: { data: any }) {
    if (!data) {
        return <div>데이터를 불러오는 중...</div>;
    }
    
    const { chartData, tableData } = data;
    const lineColors: Record<string, string> = {
        fw25: "#ef4444",   // 25FW
        ss25: "#10b981",   // 25SS
        fw24: "#fbbf24",   // FW과시즌
        core: "#3b82f6",   // SS과시즌
        past: "#9ca3af"    // CORE
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || payload.length === 0) return null;

        const rows = payload.map((entry: any) => {
            const key = entry.dataKey;
            const color = lineColors[key] || "#4b5563";
            const name = entry.name || key;
            const val = entry.value ?? 0;
            return { key, color, name, value: val };
        });

        const total = rows.reduce((sum: number, r: { value: number }) => sum + (Number(r.value) || 0), 0);

        return (
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md text-xs space-y-1">
                <div className="font-semibold text-gray-800 mb-1">{label}</div>
                {rows.map((r: { key: string; color: string; name: string; value: number }) => (
                    <div key={r.key} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span
                                className="inline-block w-3 h-3 rounded-full"
                                style={{ backgroundColor: r.color }}
                            />
                            <span className="text-gray-700">{r.name}</span>
                        </div>
                        <span className="font-medium text-gray-900">
                            {Number(r.value || 0).toLocaleString()}
                        </span>
                    </div>
                ))}
                <div className="pt-1 mt-1 border-t border-gray-100 flex items-center justify-between text-gray-900 font-semibold">
                    <span>합계</span>
                    <span>{total.toLocaleString()}</span>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4 bg-gradient-to-br from-purple-50 to-blue-50 p-4 rounded-lg">
            <div className="bg-white p-4 rounded-lg shadow-sm">
                <h3 className="text-lg font-bold mb-3 text-slate-800">시즌별 재고 25년 연말 시뮬레이션</h3>
                
                <div className="h-[350px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="month" stroke="#6b7280" />
                            <YAxis 
                                domain={[0, 'auto']} 
                                stroke="#6b7280" 
                                tickFormatter={(value) => value.toLocaleString()}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Line type="monotone" dataKey="fw25" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} name="25FW" />
                            <Line type="monotone" dataKey="ss25" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: "#10b981" }} name="25SS" />
                            <Line type="monotone" dataKey="fw24" stroke="#fbbf24" strokeWidth={2} dot={{ r: 4, fill: "#fbbf24" }} name="FW과시즌" />
                            <Line type="monotone" dataKey="core" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: "#3b82f6" }} name="SS과시즌" />
                            <Line type="monotone" dataKey="past" stroke="#9ca3af" strokeWidth={2} dot={{ r: 4, fill: "#9ca3af" }} name="CORE" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-bold mb-3 text-slate-800">재고 TAG</h4>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]"></TableHead>
                                {tableData.map((item: any, idx: number) => (
                                    <TableHead key={idx} className="text-center">{item.period}</TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">합계</TableCell>
                                {tableData.map((item: any, idx: number) => (
                                    <TableCell key={idx} className="text-center">{item.total.toLocaleString()}</TableCell>
                                ))}
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}

// CORE 할인 팝업 컴포넌트
function CoreDiscountDialog({ data }: { data: any }) {
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [comments, setComments] = React.useState<string[]>([]);
    const [chartTitle, setChartTitle] = React.useState("CORE 할인율 및 실판 매출 추이 (Daily)");

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                // Cache busting
                const timestamp = new Date().getTime();
                const response = await fetch(`/data/core-discount-daily.csv?t=${timestamp}`);
                const buffer = await response.arrayBuffer();
                let csvText;

                // 인코딩 감지 및 디코딩 (UTF-8 시도 후 실패 시 EUC-KR)
                try {
                    const decoder = new TextDecoder('utf-8', { fatal: true });
                    csvText = decoder.decode(buffer);
                } catch (e) {
                    const decoder = new TextDecoder('euc-kr');
                    csvText = decoder.decode(buffer);
                }
                
                const lines = csvText.split('\n').filter(line => line.trim() !== '');
                
                // 첫 번째 줄이 타이틀인지 확인 (헤더가 아니라면 타이틀로 간주)
                // 보통 헤더는 'date'로 시작하므로, 'date'로 시작하지 않으면 첫 줄을 타이틀로 사용
                let startIndex = 0;
                if (!lines[0].startsWith('date')) {
                    // 엑셀 저장 시 발생하는 불필요한 콤마 제거
                    setChartTitle(lines[0].replace(/,+$/, ''));
                    startIndex = 1;
                }
                
                const headers = lines[startIndex].split(',');
                
                // 코멘트 수집
                const collectedComments: string[] = [];
                
                const parsedData = lines.slice(startIndex + 1).map(line => {
                    const values = line.split(',');
                    const dateStr = values[0]; 
                    const discountStr = values[1]; 
                    const salesStr = values[2]; 
                    
                    // 코멘트가 쉼표를 포함하는 경우 처리
                    // date, discount, sales 이후의 모든 부분을 합침
                    let comment = values.slice(3).join(',');
                    
                    // 따옴표 제거 (CSV에서 쉼표 포함 문자열은 따옴표로 감싸짐)
                    if (comment) {
                        comment = comment.trim();
                        // 앞뒤 따옴표 제거
                        if (comment.startsWith('"') && comment.endsWith('"')) {
                            comment = comment.slice(1, -1);
                        }
                        // 이스케이프된 따옴표 처리 ("" -> ")
                        comment = comment.replace(/""/g, '"');
                    }

                    if (comment && comment !== '') {
                        collectedComments.push(comment);
                    }
                    
                    const dateParts = dateStr.split('-');
                    const formattedDate = `${dateParts[1]}.${dateParts[2]}`; 
                    
                    return {
                        date: formattedDate,
                        fullDate: dateStr,
                        discount: parseFloat(discountStr.replace('%', '')),
                        sales: parseFloat(salesStr)
                    };
                });
                
                setChartData(parsedData);
                setComments(collectedComments);
            } catch (error) {
                console.error("Failed to load CORE discount data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (!active || !payload || payload.length === 0) return null;

        return (
            <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-md text-xs space-y-1">
                <div className="font-semibold text-gray-800 mb-1">{label}</div>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center justify-between gap-2">
                        <span style={{ color: entry.color }}>{entry.name}:</span>
                        <span className="font-medium">
                            {entry.dataKey === 'discount' 
                                ? `${entry.value}%` 
                                : entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">데이터를 불러오는 중...</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg">
            <h3 className="text-lg font-bold mb-4 text-slate-800">{chartTitle}</h3>
            <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <defs>
                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.3}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            scale="point" 
                            padding={{ left: 10, right: 10 }} 
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            tickLine={false}
                        />
                        <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            tickFormatter={(v) => `${v}%`}
                            label={{ value: '할인율 (%)', angle: -90, position: 'insideLeft', fill: '#7c3aed', fontSize: 12 }}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            tickFormatter={(v) => v.toLocaleString()}
                            label={{ value: '실판 매출', angle: 90, position: 'insideRight', fill: '#64748b', fontSize: 12 }}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        
                        {/* 0 기준선 추가 */}
                        <ReferenceLine y={0} yAxisId="left" stroke="#cbd5e1" strokeWidth={1} />
                        
                        <Bar 
                            yAxisId="right" 
                            dataKey="sales" 
                            name="실판 매출" 
                            fill="url(#salesGradient)" 
                            barSize={12}
                            radius={[4, 4, 0, 0]}
                        />
                        <Line 
                            yAxisId="left" 
                            type="monotone" 
                            dataKey="discount" 
                            name="할인율" 
                            stroke="#7c3aed" 
                            strokeWidth={3} 
                            dot={{ r: 4, fill: "#fff", stroke: "#7c3aed", strokeWidth: 2 }} 
                            activeDot={{ r: 6, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2 }} 
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
            
            {/* 코멘트 섹션: 코멘트가 있을 때만 표시 */}
            {comments.length > 0 && (
                <div className="mt-6 bg-slate-50 p-4 rounded-md border border-slate-100">
                    <h4 className="text-sm font-bold mb-2 text-slate-700 flex items-center gap-2">
                        <LightbulbIcon className="h-4 w-4 text-amber-500" />
                        Analysis & Note
                    </h4>
                    <ul className="space-y-1">
                        {comments.map((comment, index) => (
                            <li key={index} className="text-sm text-slate-600 flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                                <span>{comment}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="mt-4 text-xs text-gray-500 text-center">
                * 2026년 1월 1일 ~ 2월 8일 데이터 기준
            </div>
        </div>
    );
}

// Reusable Interactive Chart Component
function InteractiveChartSection({ 
  title, 
  unit, 
  iconColor, 
  filterOptions, 
  insights,
  chartColor="purple",
  showPlanButton = false,
  csvChartData,
  chartType = "channel",
  inventoryPopupData
}: { 
  title: string, 
  unit: string, 
  iconColor: string, 
  filterOptions: string[], 
  insights: {color: "purple"|"blue"|"green", title: string, content: string}[],
  chartColor?: string,
  showPlanButton?: boolean,
  csvChartData?: Record<string, number[]>,
  chartType?: "channel" | "item" | "inventory",
  inventoryPopupData?: any
}) {
  const [selectedFilter, setSelectedFilter] = React.useState<string>("전체");
  const [yMax, setYMax] = React.useState(280);
  const [isYoyVisible, setIsYoyVisible] = React.useState(false);

  const handleFilterClick = (filter: string) => {
      if (selectedFilter === filter) {
          if (filter === "전체") {
             // "전체" is already selected, toggle visibility
             setIsYoyVisible(!isYoyVisible);
          } else {
             // Specific filter already selected, toggle visibility
             setIsYoyVisible(!isYoyVisible);
          }
      } else {
          setSelectedFilter(filter);
          // If switching to "전체", default to collapsed (hidden)
          // If switching to specific filter, expand (visible)
          setIsYoyVisible(filter !== "전체");
      }
  };

  // 1. Prepare Data for Main Chart (Stacked Bars) & YOY Chart (Lines)
  // We need data for ALL options to be available when "전체" is selected
  
  // Generate consistent values for each option or use CSV data
  const allSeriesData = React.useMemo(() => {
      if (csvChartData) {
          // Use CSV data
          return filterOptions.map(opt => {
              let dataKey = '';
              let cleanOpt = opt.replace(/ /g, '').replace(/&/g, '');
              
              if (chartType === "channel") {
                  // 채널 이름 매핑: "US EC" -> "USEC", "EU EC" -> "EUEC"
                  if (opt === "US EC") cleanOpt = "USEC";
                  else if (opt === "EU EC") cleanOpt = "EUEC";
                  dataKey = `차트_채널별매출추세_${cleanOpt}`;
              } else if (chartType === "item") {
                  dataKey = `차트_아이템별매출추세_${cleanOpt}`;
              } else if (chartType === "inventory") {
                  // 재고 차트: display name을 CSV 키로 매핑
                  const inventoryMapping: Record<string, string> = {
                      '25FW': '25FW',
                      '25SS': '25SS',
                      'FW과시즌': 'FW과시즌',
                      'SS과시즌': 'SS과시즌',
                      'CORE': 'CORE'
                  };
                  const csvKey = inventoryMapping[opt] || opt;
                  dataKey = `차트_아이템별재고추세_${csvKey}`;
              }
              
              const values = csvChartData[dataKey] || Array(13).fill(0);
              const yoyKey = `${dataKey}_YOY`;
              // 재고 차트도 YOY 데이터 로딩 (없으면 기본값 100)
              const yoyValues = csvChartData[yoyKey] || Array(13).fill(100);
              
              return { name: opt, values, yoyValues };
          });
      } else {
          // Fallback to generated data
          return filterOptions.map(opt => {
              const values = generateConsistentData(opt + "sales", 13, 2000, 8000);
              const yoyValues = generateConsistentData(opt + "yoy", 13, 80, 180);
              return { name: opt, values, yoyValues };
          });
      }
  }, [filterOptions, csvChartData, chartType]);

  const totalYoySeries = React.useMemo(() => {
      const totalYoyKeyMap: Record<string, string> = {
          channel: '차트_채널별매출추세_TOTAL_YOY',
          item: '차트_아이템별매출추세_TOTAL_YOY',
          inventory: '차트_아이템별재고추세_TOTAL_YOY'
      };
      const key = totalYoyKeyMap[chartType || 'channel'];
      if (key && csvChartData && csvChartData[key]) {
          return csvChartData[key];
      }
      // Fallback: average of available series YOY values
      return Array(13).fill(0).map((_, i) => {
          const seriesYoys = allSeriesData.map(series => series.yoyValues[i] || 0);
          if (seriesYoys.length === 0) return 0;
          return seriesYoys.reduce((sum, val) => sum + val, 0) / seriesYoys.length;
      });
  }, [chartType, csvChartData, allSeriesData]);

  // Main Chart Data (Monthly x-axis)
  const mainChartData = React.useMemo(() => {
      return Array(13).fill(0).map((_, i) => {
        // X축 라벨 유니크 키 생성 (25.1월, ..., 26.1월)
        const monthItem: any = { name: i < 12 ? `25.${i+1}월` : `26.${i-11}월` };
          let totalTarget = 0;
          
          allSeriesData.forEach(series => {
              // Add specific series value to the month item
              monthItem[series.name] = series.values[i];
              monthItem[`${series.name}_YOY`] = series.yoyValues[i];
              // Mock target as slightly higher than avg
              totalTarget += series.values[i] * 1.05; 
          });
          
          // Target line (sum of targets if 'All', or specific target)
          monthItem.target = Math.floor(totalTarget / (selectedFilter === "전체" ? 1 : filterOptions.length)); 
          // Actually for 'All', target should be total. For specific, it should be specific.
          // Let's simplify: In 'All', we show Stacked Bars. In 'Specific', we show Single Bar.
          if (selectedFilter === "전체" && totalYoySeries?.length) {
              monthItem.totalYOY = totalYoySeries[i] || 0;
          }
          
          return monthItem;
      });
  }, [allSeriesData, selectedFilter, filterOptions, chartType, totalYoySeries]);

  const yoyMaxForMain = React.useMemo(() => {
      const allYoys = [
          ...allSeriesData.flatMap(series => series.yoyValues || []),
          ...totalYoySeries
      ];
      const maxVal = Math.max(120, ...allYoys);
      return Math.ceil(maxVal / 10) * 10;
  }, [allSeriesData, totalYoySeries]);

  // YOY Line Chart Data
  const yoyChartData = React.useMemo(() => {
      return Array(13).fill(0).map((_, i) => {
        // X축 라벨 유니크 키 생성 (25.1월, ..., 26.1월)
        const item: any = { name: i < 12 ? `25.${i+1}월` : `26.${i-11}월` };
          allSeriesData.forEach(series => {
              item[series.name] = series.yoyValues[i];
          });
          return item;
      });
  }, [allSeriesData]);


  // 2. Determine what to show based on filter
  // If '전체': Show ALL bars (Stacked) and ALL YOY lines.
  // If specific: Show ONLY that bar and ONLY that YOY line.
  
  const visibleSeries = selectedFilter === "전체" ? filterOptions : [selectedFilter];
  
  // Colors for series (Pastel tones - Tailwind 300)
  const colors = ["#fcd34d", "#fca5a5", "#93c5fd", "#6ee7b7", "#c4b5fd", "#f9a8d4", "#67e8f9", "#fdba74", "#d1d5db"];
  // Text colors for badges (Darker tones - Tailwind 700)
  const textColors = ["#b45309", "#b91c1c", "#1d4ed8", "#047857", "#6d28d9", "#be185d", "#0e7490", "#c2410c", "#374151"];

  return (
    <div className="space-y-4 h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-2 flex-none">
            <CardTitle className="text-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", iconColor)}></div>
                    {title} <span className="text-gray-500 text-base font-normal">({unit})</span>
                </div>
                {showPlanButton && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-sm px-3 bg-green-100 hover:bg-green-200 text-green-700 border-green-300">
                                25SS 재고소진 계획
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>25SS 재고소진 계획</DialogTitle>
                            </DialogHeader>
                            <InventoryPlanDialog data={inventoryPopupData} />
                        </DialogContent>
                    </Dialog>
                )}
            </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col space-y-6">
            {/* Top Main Chart */}
            <div className="h-[250px] w-full flex-none min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%" minHeight={250}>
                    <ComposedChart data={mainChartData} margin={{top:10, right:10, left:-10, bottom:0}}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            tick={{fontSize: 12}} 
                            axisLine={false} 
                            tickLine={false} 
                            interval={0}
                            tickFormatter={(value) => value?.replace(/\(예상\)/g, '').replace(/25\.|26\./, '') || value}
                        />
                        <YAxis 
                            yAxisId="left" 
                            orientation="left" 
                            tick={{fontSize: 12}} 
                            axisLine={false} 
                            tickLine={false}
                            tickFormatter={(value) => {
                                if (chartType === "inventory") {
                                    // 재고 차트: 숫자 앞에 $ 추가
                                    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
                                }
                                return `$${value.toLocaleString()}`;
                            }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            domain={[0, 280]}
                            ticks={[0, 40, 80, 120, 160, 200, 240, 280]}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                            formatter={(value: number, name: string) => {
                                if (typeof name === 'string' && name.includes('YoY')) {
                                    return [`${value}%`, name];
                                }
                                if (chartType === "inventory") {
                                    // 재고 차트: 숫자 앞에 $ 추가
                                    return [`$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, name];
                                }
                                return [`$${value.toLocaleString()}`, name];
                            }}
                        />
                        {/* Render Bars for visible series */}
                        {visibleSeries.map((key, idx) => (
                            <Bar 
                                key={key} 
                                yAxisId="left" 
                                dataKey={key} 
                                stackId={selectedFilter === "전체" ? "a" : undefined} // Stack only when 'All' is selected
                                fill={colors[filterOptions.indexOf(key) % colors.length]} 
                            />
                        ))}
                        {/* Render YOY lines */}
                        {selectedFilter === "전체" && totalYoySeries?.length ? (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="totalYOY"
                                stroke="#6b7280"
                                strokeWidth={2.5}
                                dot={false}
                                name="전체 YoY"
                            />
                        ) : (
                            visibleSeries.map((key) => {
                                const yoyKey = `${key}_YOY`;
                                return (
                                    <Line
                                        key={`${key}-yoy`}
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey={yoyKey}
                                        stroke="#4b5563"
                                        strokeWidth={2}
                                        dot={false}
                                        name={`${key} YoY`}
                                    />
                                );
                            })
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-1.5 flex-none">
                <Button 
                    variant={selectedFilter === "전체" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFilterClick("전체")}
                    className={cn("h-7 text-sm px-3", selectedFilter === "전체" ? "bg-slate-800 hover:bg-slate-900" : "")}
                >
                    전체
                </Button>
                {filterOptions.map((opt, idx) => {
                    const activeStyle = "ring-2 ring-offset-1 ring-black font-bold";
                    const colorIndex = idx % colors.length;
                    
                    return (
                        <Badge
                            key={opt}
                            variant="outline"
                            onClick={() => handleFilterClick(opt)}
                            className={cn("cursor-pointer h-7 px-3 font-normal border", selectedFilter === opt && activeStyle)}
                            style={{
                                backgroundColor: colors[colorIndex],
                                color: textColors[colorIndex],
                                borderColor: colors[colorIndex]
                            }}
                        >
                            {opt}
                        </Badge>
                    )
                })}
            </div>

            {/* Expanded Detail View (YOY & Table) - Show for "전체" too, displaying all lines */}
            {(isYoyVisible) && (
                <div className="space-y-4 pt-2 border-t flex-none">
                    {/* Title & Slider */}
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-gray-800">
                            {selectedFilter === "전체" ? "전체 채널" : selectedFilter} YOY 추이(%)
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500">Y축 최대값:</span>
                            <Slider 
                                value={[yMax]} 
                                onValueChange={(val) => setYMax(val[0])} 
                                max={300} 
                                step={10} 
                                className="w-[80px]" 
                            />
                            <Input 
                                type="number" 
                                value={yMax} 
                                onChange={(e) => setYMax(Number(e.target.value))} 
                                className="w-[50px] h-6 text-[10px] text-right px-1" 
                            />
                            <span className="text-[10px] text-gray-500">%</span>
                        </div>
                    </div>

                    {/* YOY Line Chart */}
                    <div className="h-[150px] w-full min-h-[150px]">
                        <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                            <LineChart data={yoyChartData} margin={{top:5, right:10, left:-20, bottom:0}}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{fontSize: 10}} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    interval={0}
                                    tickFormatter={(value) => value?.replace(/\(예상\)/g, '').replace(/25\.|26\./, '') || value}
                                />
                                <YAxis domain={[0, yMax]} tick={{fontSize: 10}} axisLine={false} tickLine={false} unit="%" />
                                <Tooltip />
                                {/* Render Line for selected series or ALL series if "전체" */}
                                {selectedFilter === "전체" ? (
                                    filterOptions.map((opt, idx) => (
                                        <Line 
                                            key={opt}
                                            type="monotone" 
                                            dataKey={opt} 
                                            stroke={colors[idx % colors.length]} 
                                            strokeWidth={2} 
                                            dot={{r:2}} 
                                            activeDot={{r:4}} 
                                        />
                                    ))
                                ) : (
                                    <Line 
                                        type="monotone" 
                                        dataKey={selectedFilter} 
                                        stroke={colors[filterOptions.indexOf(selectedFilter) % colors.length]} 
                                        strokeWidth={3} 
                                        dot={{r:3}} 
                                        activeDot={{r:5}} 
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Data Table with Scroll */}
                    <ScrollArea className="h-[200px] w-full border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 hover:bg-slate-50 h-8">
                                    <TableHead className="w-[80px] font-bold text-xs p-1 h-8">항목</TableHead>
                                    {["01월", "02월", "03월", "04월", "05월", "06월", "07월", "08월", "09월", "10월", "11월", "12월"].map(m => (
                                        <TableHead key={m} className="text-center font-bold text-xs min-w-[40px] p-1 h-8">{m}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Render Row for selected series or ALL if "전체" */}
                                {(() => {
                                    if (selectedFilter === "전체") {
                                        return filterOptions.map((opt, idx) => {
                                            const series = allSeriesData.find(s => s.name === opt);
                                            if (!series) return null;
                                            return (
                                                <TableRow key={opt} className="h-8 hover:bg-slate-50">
                                                    <TableCell className="font-medium text-xs p-1 h-8 flex items-center gap-1">
                                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                                                        {opt}
                                                    </TableCell>
                                                    {series.yoyValues.map((val, j) => (
                                                        <TableCell key={j} className={cn("text-center text-xs p-1 h-8", val >= 100 ? "text-green-600 font-bold" : "text-red-500")}>
                                                            {val}%
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            );
                                        });
                                    }
                                    
                                    const series = allSeriesData.find(s => s.name === selectedFilter);
                                    return series ? (
                                        <TableRow className="h-8 hover:bg-slate-50 bg-purple-50/50">
                                            <TableCell className="font-medium text-xs p-1 h-8">{selectedFilter}</TableCell>
                                            {series.yoyValues.map((val, j) => (
                                                <TableCell key={j} className={cn("text-center text-xs p-1 h-8", val >= 100 ? "text-green-600 font-bold" : "text-red-500")}>
                                                    {val}%
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ) : null;
                                })()}
                            </TableBody>
                        </Table>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
            )}
            
            {/* Insight Cards */}
            <div className="grid grid-cols-1 gap-2 flex-none">
                 {insights.map((insight, idx) => {
                     // 아이콘 매핑
                     let Icon = LightbulbIcon;
                     if (insight.title.includes("조기경보") || insight.title.includes("리스크")) Icon = AlertTriangleIcon;
                     else if (insight.title.includes("긍정신호") || insight.title.includes("핵심") || insight.title.includes("전략")) Icon = TargetIcon;
                     else if (insight.title.includes("트렌드")) Icon = TrendingUpIcon;
                     else if (insight.title.includes("카테고리")) Icon = BriefcaseIcon;

                     // 색상 스타일 매핑
                     const colorStyles = {
                        purple: "bg-purple-50 text-purple-900",
                        blue: "bg-blue-50 text-blue-900",
                        green: "bg-green-50 text-green-900",
                     };
                     const titleColorStyles = {
                        purple: "text-purple-700",
                        blue: "text-blue-700",
                        green: "text-green-700",
                     };
                     
                     // 스토리지 키 생성 (안전한 문자열로 변환)
                     const safeTitle = insight.title.replace(/\s+/g, '-');
                     const storageKey = `insight-card-${safeTitle}`;

                     return (
                         <EditableInsightCard 
                            key={idx}
                            title={insight.title}
                            icon={Icon}
                            defaultItems={insight.content.split('\n').filter(Boolean)}
                            storageKey={storageKey}
                            cardClassName={cn("p-3 rounded-md text-sm space-y-2", colorStyles[insight.color])}
                            titleClassName={cn("font-bold text-base", titleColorStyles[insight.color])}
                         />
                     );
                 })}
            </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Mock Data for P&L Table (Existing)
// CSV 파싱 헬퍼 함수
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

// 손익계산서 CSV 파싱 및 표시 컴포넌트
function IncomeStatementSection({ selectedMonth }: { selectedMonth: string }) {
  const [csvData, setCsvData] = React.useState<any[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = React.useState(false);
  const [showAllMonths, setShowAllMonths] = React.useState(false);
  const shouldShowIncomeHeader = (header: string, idx: number) => {
    if (showAllMonths) return true;
    if (idx === 0) return true;
    if (idx <= 10) return false; // Jan~Oct 숨김
    const hTrim = (header || '').trim();
    // 월 접기 상태에서 Nov, 24-Dec도 숨김
    return !(
      hTrim === 'Nov' ||
      hTrim === 'Nov-25A' ||
      hTrim === 'Nov-25F' ||
      hTrim.startsWith('Nov-25') ||
      hTrim === '24-Nov' ||
      hTrim.startsWith('24-Nov')
    );
  };

  React.useEffect(() => {
    setLoading(true);
    // CSV 파일 읽기
    fetch('/data/income-statement.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          setLoading(false);
          return;
        }
        
        // 헤더 파싱 (두 번째 줄)
        const headerLine = lines[1];
        const parsedHeaders = parseCSVLine(headerLine);
        // 첫 번째 열(구분) 제외하고 모든 열 추출
        let dataHeaders = parsedHeaders.slice(1).filter(h => h && h.trim() !== '');
        
        // "25년 합계"와 "합계 YoY" 컬럼 제거
        dataHeaders = dataHeaders.filter(h => {
          const trimmed = h && h.trim();
          return trimmed !== '25년 합계' && trimmed !== '합계 YoY' && trimmed !== 'Total';
        });
        
        // 비교 컬럼(24-Nov 등)을 기준 컬럼(Nov-25F 등) 앞으로 이동하는 함수
        const moveYoYColumn = (targetCol: string, yoyCol: string) => {
             const targetIndex = dataHeaders.findIndex(h => h && h.trim() === targetCol);
             const yoyIndex = dataHeaders.findIndex(h => h && (h.trim() === yoyCol || h.trim().startsWith(yoyCol)));
             
             if (targetIndex >= 0) {
                 if (yoyIndex >= 0) {
                     if (yoyIndex !== targetIndex - 1) {
                         const removed = dataHeaders.splice(yoyIndex, 1)[0];
                         const newTargetIndex = dataHeaders.findIndex(h => h && h.trim() === targetCol);
                         if (newTargetIndex >= 0) {
                             dataHeaders.splice(newTargetIndex, 0, removed);
                         }
                     }
                 } else {
                     dataHeaders.splice(targetIndex, 0, yoyCol);
                 }
             }
        };

        // 24-Nov -> Nov-25A/F
        moveYoYColumn('Nov-25A', '24-Nov');
        moveYoYColumn('Nov-25F', '24-Nov');
        
        // 24-Dec -> Dec-25F/A
        moveYoYColumn('Dec-25F', '24-Dec');
        moveYoYColumn('Dec-25A', '24-Dec');
        
        setHeaders(['구분', ...dataHeaders]);
        
        // 데이터 파싱
        const parsed: any[] = [];
        let currentParent: any = null;
        let lastMainCategoryKey: string | null = null; // 마지막 메인 카테고리의 키 추적
        
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim() || line.match(/^,{10,}/)) continue; // 빈 줄 스킵
          
          const values = parseCSVLine(line);
          if (values.length < 2 || !values[0]) continue;
          
          const label = values[0].trim();
          
          // 메인 카테고리인지 확인 (숫자.로 시작)
          const isMainCategory = /^[0-9]+\./.test(label);
          
          // 하위 항목인지 확인
          const isSubItem = !isMainCategory && 
                           !['매출총이익', '직접이익', '영업이익', '할인율', '생산원가율', '직접비용율', '영업이익율'].includes(label) &&
                           (label.includes('Ecommerce') || label.includes('Wholesale') || 
                            label.includes('Other Income') || label.includes('License') ||
                            ['SEM광고비', '운반비', '보관료', '지급수수료', '기타비용', 
                             '급여', '광고선전비', '출장비/식대', '사무실임차료', '샘플', 
                             '감가상각비'].includes(label));
          
          // 모든 월 데이터 추출 (구분 열 제외)
          // dataHeaders에 맞춰 값 매핑 (CSV의 실제 헤더 순서와 일치)
          // "25년 합계" 또는 "Total"까지, "합계 YoY"까지 포함
          const totalIndexInParsed = parsedHeaders.findIndex(h => {
            const trimmed = h && h.trim();
            return trimmed === 'Total' || trimmed === '25년 합계';
          });
          const sumYoYIndex = parsedHeaders.findIndex(h => h && h.trim() === '합계 YoY');
          
          // 합계 YoY까지 포함하려면 더 큰 인덱스 사용
          const lastHeaderIndex = sumYoYIndex > 0 ? sumYoYIndex : 
                                  (totalIndexInParsed > 0 ? totalIndexInParsed : parsedHeaders.length - 1);
          const csvHeaderCount = lastHeaderIndex > 0 ? lastHeaderIndex + 1 : parsedHeaders.length - 1;
          
          // CSV의 실제 헤더 순서대로 값 추출 (구분 제외, "합계 YoY"까지)
          const csvValues = values.slice(1, 1 + csvHeaderCount);
          
          // dataHeaders와 CSV 헤더를 매핑하여 올바른 순서로 재배열
          const monthValues: string[] = [];
          const csvHeaders = parsedHeaders.slice(1, 1 + csvHeaderCount);
          
          // dataHeaders 순서대로 값 매핑
          for (const dataHeader of dataHeaders) {
            const dTrim = dataHeader && dataHeader.trim();
            
            // CSV 헤더에서 직접 찾기
            const csvHeaderIndex = csvHeaders.findIndex(h => {
              const hTrim = h && h.trim();
              // "25년 합계"와 "합계 YoY"는 제외
              if (hTrim === '25년 합계' || hTrim === '합계 YoY' || hTrim === 'Total') {
                return false;
              }
              // 나머지는 정확히 매칭
              return hTrim === dTrim || 
                     (hTrim === '24-Nov' && dTrim === '24-Nov');
            });
            
            if (csvHeaderIndex >= 0 && csvHeaderIndex < csvValues.length) {
              monthValues.push(csvValues[csvHeaderIndex] || '');
            } else {
              // dataHeaders에 있지만 CSV에 없는 경우 (코드에서 추가한 경우)
              monthValues.push('');
            }
          }
          
          // 각 월별 값 정제
          const cleanedValues = monthValues.map((val: string, idx: number) => {
            const header = dataHeaders[idx];
            // YoY 컬럼은 정제하지 않고 원본 형태 유지 (단, 따옴표는 제거)
            if (header && (header.trim() === '당월 YoY' || header.trim() === 'YTD YoY' || header.trim() === '합계 YoY')) {
               return val.replace(/["]/g, '').trim();
            }

            let cleaned = val.replace(/[$,"]/g, '').trim();
            if (cleaned === '-' || !cleaned || cleaned === '') return '';
            return cleaned;
          });
          
          const cleanLabel = label.replace(/^[0-9]+\./, '').trim();
          
          // 영업외 수익비용과 당기순이익 제외
          if (cleanLabel === '영업외 수익비용' || cleanLabel === '당기순이익' || 
              label.includes('영업외 수익비용') || label.includes('당기순이익') ||
              label.includes('JVA중재') || label.includes('이자비용') || 
              label.includes('법인세비용')) {
            continue; // 이 행을 건너뛰기
          }
          
          const isMain = isMainCategory || ['매출총이익', '직접이익', '영업이익'].includes(label);
          const isCalculationResult = ['매출총이익', '직접이익', '영업이익'].includes(cleanLabel);
          
          parsed.push({
            label: cleanLabel,
            values: cleanedValues,
            isMainCategory: isMain,
            isSubItem,
            parentCategory: isSubItem ? currentParent : null,
            categoryKey: isMain && !isCalculationResult ? cleanLabel : null,
            isCalculationResult,
            alignWithParent: isCalculationResult ? lastMainCategoryKey : null // 계산 결과는 이전 메인 카테고리와 같은 들여쓰기
          });
          
          // 현재 부모 카테고리 업데이트
          if (isMainCategory) {
            currentParent = label.replace(/^[0-9]+\./, '').trim();
            lastMainCategoryKey = currentParent; // 마지막 메인 카테고리 키 저장
          }
        }
        
        setCsvData(parsed);
        setLoading(false);
      })
      .catch(err => {
        console.error('CSV 로드 오류:', err);
        setLoading(false);
      });
  }, []); // selectedMonth 제거 - 모든 데이터 표시

  const formatValue = (value: string) => {
    if (!value || value === '' || value === '-') return '-';
    
    // 퍼센트 값 처리
    if (value.includes('%')) {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return `${num.toFixed(1)}%`;
      }
      return value;
    }
    
    // 특수 문자 처리 (△, + 등)
    if (value.includes('△') || value.startsWith('+')) {
      return value; // 특수 문자 유지
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    if (num < 0) return `(${Math.abs(num).toLocaleString()})`;
    return num.toLocaleString();
  };

  const getValueColor = (value: string) => {
    if (!value || value === '' || value === '-') return '';
    
    // %나 %p가 포함된 경우 처리
    let checkValue = value;
    if (value.includes('%')) {
      checkValue = value.replace(/[%p]/g, '');
    }
    
    const num = parseFloat(checkValue);
    if (!isNaN(num) && num < 0 && !value.includes('△')) {
      return "text-red-600";
    }
    return "";
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedCategories(new Set());
      setAllExpanded(false);
    } else {
      const allCategories = csvData
        .filter(row => row.isMainCategory && row.categoryKey)
        .map(row => row.categoryKey);
      setExpandedCategories(new Set(allCategories));
      setAllExpanded(true);
    }
  };

  // 필터링된 데이터 (접힌 항목 제외)
  const filteredData = React.useMemo(() => {
    const result: any[] = [];
    let currentCategory: string | null = null;
    
    for (const row of csvData) {
      if (row.isMainCategory) {
        currentCategory = row.categoryKey;
        result.push(row);
      } else if (row.isSubItem) {
        // 하위 항목은 부모 카테고리가 펼쳐져 있을 때만 표시
        if (currentCategory && expandedCategories.has(currentCategory)) {
          result.push(row);
        }
      } else {
        // 계산 결과 항목은 항상 표시
        result.push(row);
      }
    }
    
    return result;
  }, [csvData, expandedCategories]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">데이터를 불러오는 중...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">STO 손익계산서(단위 : K $)</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
            >
              {showAllMonths ? "월 접기" : "월 펼치기"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
            >
              {allExpanded ? "접기" : "열기"}
            </Button>
        </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.filter((header: any, idx: number) => {
                    // Keep first column (구분) and columns starting from Nov
                    // Header structure: 0=구분, 1=Jan, ..., 10=Oct, 11=Nov-25F, 12=24-Nov, 13=당월 YoY, 14=YTD, 15=YTD YoY, 16=25년 합계, 17=합계 YoY
                    // Dec-25F와 24-Dec는 제거됨
                    // We want to hide indices 1 to 10 (Jan to Oct), keep everything from Nov onwards (idx >= 11)
                    return shouldShowIncomeHeader(header, idx);
                  }).map((header, idx, arr) => {
                    let displayHeader = header;
                    if (header !== '구분') {
                      // Nov-25F → 25-Nov로 변경
                      if (header === 'Nov-25F' || header === 'Nov') {
                        displayHeader = '25-Nov';
                      } else if (header === 'Dec-25F' || header === 'Dec') {
                        displayHeader = '25-Dec';
                      } else if (header.startsWith('24-Nov') || header === '24-Nov') {
                        displayHeader = '24-Nov';
                      } else {
                        displayHeader = header.replace('-25A', '').replace('-25F', '(예상)');
                      }
                    }
                    
                    // 세트별 배경색 및 구분선 설정
                    // 첫 번째 세트: 24-Dec, Dec, 당월 YoY (순서 변경됨)
                    const isSet1Start = header === '24-Dec' || header.startsWith('24-Dec');
                    const isSet1 = header === 'Nov-25F' || header === 'Nov' || 
                                  header === '24-Dec' || header.startsWith('24-Dec') || header === '당월 YoY';
                    const isSet1End = header === '당월 YoY';
                    
                    // 두 번째 세트: YTD, YTD YoY (초록색 파스텔톤)
                    const isSet2Start = header === 'YTD';
                    const isSet2 = header === 'YTD' || header === 'YTD YoY';
                    const isSet2End = header === 'YTD YoY';
                    
                    // 세트 구분을 위한 스타일 - 세트 사이에만 구분선 (회색으로 통일)
                    let setStyle = "";
                    const borderClass = "border-gray-500";
                    
                    if (isSet1) {
                      if (isSet1Start) {
                        setStyle += ` border-l-2 ${borderClass}`;
                      }
                      if (isSet1End) {
                        setStyle += ` border-r-2 ${borderClass}`;
                      }
                    } else if (isSet2) {
                      if (isSet2Start) {
                        setStyle += ` border-l-2 ${borderClass}`;
                      }
                      if (isSet2End) {
                        setStyle += ` border-r-2 ${borderClass}`;
                      }
                    }
                    
                    return (
                      <TableHead 
                        key={idx} 
                        className={cn(
                          header === '구분' ? "w-[250px] font-bold text-left" : 
                          header.includes('비고') ? "text-center font-bold min-w-[100px]" :
                          "text-right font-bold min-w-[100px]",
                          setStyle
                        )}
                      >
                        {displayHeader}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, idx) => {
                  const isExpanded = row.categoryKey ? expandedCategories.has(row.categoryKey) : false;
                  
                  const isRatioRow = ['할인율', '생산원가율', '직접비용율', '영업이익율'].includes(row.label);

                  return (
                    <TableRow 
                      key={idx}
                      className={cn(
                        row.isMainCategory ? "bg-gray-100 cursor-pointer" : 
                        row.isSubItem ? "bg-gray-50" : "",
                        "hover:bg-gray-50"
                      )}
                      onClick={() => row.isMainCategory && row.categoryKey && toggleCategory(row.categoryKey)}
                    >
                      <TableCell className={cn(
                        "flex items-center h-full", // flex 적용
                        row.isMainCategory ? "font-bold text-base" : "font-medium",
                        row.isSubItem ? "pl-12 text-sm" : "pl-2", // 서브 항목 들여쓰기 조정
                        (row.isCalculationResult || isRatioRow) ? "font-bold text-base" : ""
                      )}>
                        {row.isMainCategory && row.categoryKey && !row.isCalculationResult && (
                          <span className="w-4 flex justify-center mr-1 text-xs">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        )}
                        {/* 계산 결과 및 비율 항목은 화살표 공간만큼 여백 추가하여 정렬 맞춤 */}
                        {(row.isCalculationResult || isRatioRow) && (
                          <span className="w-4 mr-1 inline-block"></span>
                        )}
                        {row.label}
                      </TableCell>
                      {(() => {
                        const filteredValues = row.values.filter((_: any, colIdx: number) => {
                          const headerIdx = colIdx + 1; // +1 is 구분
                          const header = headers[headerIdx];
                          return shouldShowIncomeHeader(header, headerIdx);
                        });
                        
                        return filteredValues.map((value: string, colIdx: number) => {
                          // "25년 합계" column 확인 - filteredHeaders에서 확인
                          const filteredHeaders = headers.filter((header: any, idx: number) =>
                            shouldShowIncomeHeader(header, idx)
                          );
                          const currentHeader = filteredHeaders[colIdx + 1]; // +1은 구분 컬럼 제외
                          
                          const isYoYColumn = currentHeader === '당월 YoY' || currentHeader === 'YTD YoY';

                          // 세트별 배경색 및 구분선 설정 (헤더와 동일)
                          const isSet1Start = currentHeader === '24-Dec' || currentHeader.startsWith('24-Dec');
                          const isSet1 = currentHeader === 'Nov-25F' || currentHeader === 'Nov' || 
                                        currentHeader === '24-Dec' || currentHeader.startsWith('24-Dec') || currentHeader === '당월 YoY';
                          const isSet1End = currentHeader === '당월 YoY';
                          
                          const isSet2Start = currentHeader === 'YTD';
                          const isSet2 = currentHeader === 'YTD' || currentHeader === 'YTD YoY';
                          const isSet2End = currentHeader === 'YTD YoY';

                          let displayValue = isYoYColumn ? value : formatValue(value);
                          let cellColorClass = getValueColor(value);
                          
                          // 세트 구분을 위한 스타일 - 세트 사이에만 구분선 (회색으로 통일)
                          let setStyle = "";
                          const borderClass = "border-gray-500";
                          
                          if (isSet1) {
                            if (isSet1Start) {
                              setStyle += ` border-l-2 ${borderClass}`;
                            }
                            if (isSet1End) {
                              setStyle += ` border-r-2 ${borderClass}`;
                            }
                          } else if (isSet2) {
                            if (isSet2Start) {
                              setStyle += ` border-l-2 ${borderClass}`;
                            }
                            if (isSet2End) {
                              setStyle += ` border-r-2 ${borderClass}`;
                            }
                          }

                          return (
                            <TableCell 
                              key={colIdx}
                              className={cn(
                                "text-right font-medium",
                                cellColorClass,
                                setStyle
                              )}
                            >
                              {displayValue}
                            </TableCell>
                          );
                        });
                      })()}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}

// STE 손익계산서 컴포넌트
function STEIncomeStatementSection() {
  const [csvData, setCsvData] = React.useState<any[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
  // STE 표에서만: Jan~Nov 컬럼은 기본 접힘
  const [showAllMonths, setShowAllMonths] = React.useState(false);

  const toggleRow = (label: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  React.useEffect(() => {
    setLoading(true);
    fetch('/data/ste-income-statement.csv')
      .then(async (res) => {
        // Excel 호환을 위해 UTF-16LE(Unicode)로 저장될 수 있어 arrayBuffer로 받아서 디코딩 처리
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);

        // BOM 기반 인코딩 감지
        // UTF-16LE: FF FE
        // UTF-8 BOM: EF BB BF
        let decodedText = '';
        if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
          decodedText = new TextDecoder('utf-16le').decode(bytes);
        } else if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
          decodedText = new TextDecoder('utf-8').decode(bytes);
        } else {
          // fallback
          decodedText = new TextDecoder('utf-8').decode(bytes);
        }

        return decodedText;
      })
      .then(text => {
        const lines = text
          .split(/\r?\n/)
          .map(l => l.trim())
          .filter(Boolean)
          // Excel에서 "구분,Jan-25,..." 처럼 라인 전체를 큰따옴표로 감싸 저장하는 경우가 있어 방어 처리
          .map((line) => {
            const t = line.trim();
            if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
              return t.slice(1, -1).replace(/""/g, '"');
            }
            return t;
          });
        if (lines.length < 1) {
          setLoading(false);
          return;
        }
        
        // 헤더 파싱
        const headerLine = lines[0];
        const parsedHeaders = parseCSVLine(headerLine);
        // Excel용 UTF-8 BOM 제거
        if (parsedHeaders.length > 0) {
          parsedHeaders[0] = (parsedHeaders[0] || '').replace(/^\uFEFF/, '');
        }
        setHeaders(parsedHeaders);
        
        // 데이터 파싱
        const parsed: any[] = [];
        let currentParent: string | null = null;

        // STE 표 전용: 영업비(상위) + 4개 항목(하위) 묶기/합계 계산
        const operatingExpenseChildren = new Set<string>([
          '광고선전비',
          '기타판관비',
          '감가상각비',
        ]);
        const operatingExpenseParentLabel = '영업비';
        let operatingExpenseSum: number[] | null = null; // headers[1..]에 대응 (values.slice(1))

        const parseNumber = (raw: string) => {
          const s = (raw || '').toString().replace(/["$,]/g, '').trim();
          if (!s || s === '-') return 0;
          const n = Number(s);
          return Number.isFinite(n) ? n : 0;
        };
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = parseCSVLine(line);
          if (values.length < 2) continue;
          
          // Excel에서 '-Movin' 같은 값이 수식으로 해석되지 않도록 CSV에서 "'-Movin" 형태로 저장할 수 있음
          // 앱에서는 둘 다 처리
          const labelRaw = (values[0] || '').trim().replace(/^\uFEFF/, '');
          
          // 하위 항목 확인 (- 또는 '- 로 시작)
          const isSubItem = labelRaw.startsWith("'-") || labelRaw.startsWith('-');
          const cleanLabel = labelRaw.replace(/^'-/, '').replace(/^-/, '').trim();
          
          // STE 표에서만: 고정비 계 행은 아예 제외
          if (cleanLabel === '고정비 계') {
            continue;
          }

          // STE 표 전용: 4개 항목은 "영업비" 하위로 강제 묶기
          const isOperatingExpenseChild = operatingExpenseChildren.has(cleanLabel);
          const finalIsSubItem = isSubItem || isOperatingExpenseChild;
          const finalParent = finalIsSubItem
            ? (isOperatingExpenseChild ? operatingExpenseParentLabel : currentParent)
            : null;

          // 메인 항목
          const isMainCategory = !finalIsSubItem;
          
          // 부모 카테고리 추적
          if (isMainCategory) {
            currentParent = cleanLabel;
          }
          
          // 계산 결과 행 (배경색 등 강조)
          const isCalculationResult = ['고정비 계', '영업이익', '감가비 조정 후 영업이익'].includes(cleanLabel);

          // 하위 항목이 있는 메인 카테고리인지 확인 (다음 줄이 하위 항목인지 미리 확인하거나, 파싱 후 처리)
          // 여기서는 '라이선스 매출'만 하위 항목이 있다는 것을 알고 있으므로 간단히 처리 가능하지만,
          // 범용성을 위해 hasChildren 속성을 나중에 계산하거나 여기서 처리.
          // 일단 parsed에 parent 정보를 넣고 나중에 hasChildren을 계산하는 게 나음.

          parsed.push({
            label: cleanLabel,
            values: values.slice(1),
            isSubItem: finalIsSubItem,
            isMainCategory,
            isCalculationResult,
            parent: finalParent
          });

          // "영업비" 합계 계산 (4개 하위 항목 합산)
          if (isOperatingExpenseChild) {
            const rowVals = values.slice(1);
            if (!operatingExpenseSum) {
              operatingExpenseSum = new Array(rowVals.length).fill(0);
            }
            for (let j = 0; j < rowVals.length; j++) {
              operatingExpenseSum[j] += parseNumber(rowVals[j]);
            }
          }
        }

        // "영업비" 상위 행 삽입 (4개 항목 위, 기본 접힘)
        if (operatingExpenseSum) {
          const firstChildIdx = parsed.findIndex(r => r.parent === operatingExpenseParentLabel);
          if (firstChildIdx >= 0) {
            parsed.splice(firstChildIdx, 0, {
              label: operatingExpenseParentLabel,
              values: operatingExpenseSum.map(n => String(n)),
              isSubItem: false,
              isMainCategory: true,
              isCalculationResult: false,
              parent: null
            });
          }
        }
        
        // hasChildren 속성 추가
        const dataWithChildrenInfo = parsed.map(row => {
           const hasChildren = parsed.some(r => r.parent === row.label);
           return { ...row, hasChildren };
        });
        
        setCsvData(dataWithChildrenInfo);
        setLoading(false);
      })
      .catch(err => {
        console.error('STE CSV 로드 오류:', err);
        setLoading(false);
      });
  }, []);

  const formatValue = (value: string) => {
    if (!value || value === '' || value === '-') return '-';
    
    // 퍼센트 값 처리
    if (value.includes('%')) {
      return value;
    }
    
    // 쉼표 제거 및 숫자 변환
    const cleanValue = value.replace(/,/g, '');
    const num = parseFloat(cleanValue);
    
    if (isNaN(num)) return value;
    if (num < 0) return `(${Math.abs(num).toLocaleString()})`;
    return num.toLocaleString();
  };

  const getValueColor = (value: string) => {
    if (!value || value === '' || value === '-') return '';
    
    const cleanValue = value.replace(/,/g, '');
    const num = parseFloat(cleanValue);
    
    if (!isNaN(num) && num < 0) {
      return "text-red-600";
    }
    return "";
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">데이터를 불러오는 중...</div>
      </Card>
    );
  }

  // STE 표에서만: Jan-25A ~ Nov-25A 숨김/표시 제어
  const foldMonthHeaders = new Set([
    'Jan-25A',
    'Feb-25A',
    'Mar-25A',
    'Apr-25A',
    'May-25A',
    'Jun-25A',
    'Jul-25A',
    'Aug-25A',
    'Sep-25A',
    'Oct-25A',
    'Nov-25A',
  ]);
  const visibleHeaderIndices = headers
    .map((h, idx) => ({ h: (h || '').trim(), idx }))
    .filter(({ h, idx }) => {
      if (idx === 0) return true; // 첫 컬럼(중분류)은 항상 표시
      if (showAllMonths) return true;
      // 기본(접힘) 상태에서는 Jan~Nov만 숨김
      return !foldMonthHeaders.has(h);
    })
    .map(({ idx }) => idx);

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">STE 손익계산서 (단위 : K $)</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAllMonths(prev => !prev)}
          className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
        >
          {showAllMonths ? "월 접기" : "월 펼치기"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-50/50">
                  {visibleHeaderIndices.map((headerIndex) => {
                    const header = headers[headerIndex];
                    const index = headerIndex;
                    return (
                    <th 
                      key={index} 
                      className={`h-12 px-4 align-middle font-bold text-muted-foreground [&:has([role=checkbox])]:pr-0 ${
                        index === 0
                          ? "w-[250px] font-bold text-left sticky left-0 z-20 bg-gray-50"
                          : "text-right font-bold min-w-[100px]"
                      }`}
                    >
                      {header === '구분' ? '중분류' : header}
                    </th>
                  )})}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {csvData.map((row, rowIndex) => {
                  // 하위 항목인 경우 부모가 펼쳐져 있는지 확인
                  if (row.isSubItem && row.parent && !expandedRows.has(row.parent)) {
                    return null; // 숨김
                  }

                  return (
                    <tr 
                      key={rowIndex} 
                      className={cn(
                        row.isMainCategory ? "bg-gray-100" :
                        row.isSubItem ? "bg-gray-50" : "",
                        "hover:bg-gray-50",
                        row.hasChildren ? "cursor-pointer" : ""
                      )}
                    >
                      <td
                        className={cn(
                          "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 sticky left-0 z-10 flex items-center h-full",
                          row.isMainCategory ? "font-bold text-base" : "font-medium",
                          row.isSubItem ? "pl-12 text-sm text-gray-600" : "pl-2",
                          row.isCalculationResult ? "font-bold text-base" : "",
                          row.isMainCategory ? "bg-gray-100" : "bg-white",
                          row.hasChildren ? "cursor-pointer" : ""
                        )}
                        onClick={() => {
                          if (row.hasChildren) toggleRow(row.label);
                        }}
                      >
                        {row.hasChildren && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(row.label);
                            }}
                            className="w-4 flex justify-center mr-1 text-xs text-gray-500"
                            aria-label={`${row.label} ${expandedRows.has(row.label) ? "접기" : "펼치기"}`}
                          >
                            {expandedRows.has(row.label) ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {/* 아이콘 자리 고정: 하위행이 아닌 경우(메인/계산행 포함) 항상 w-4 공간 확보 */}
                        {!row.hasChildren && !row.isSubItem ? (
                          <span className="w-4 mr-1 inline-block" />
                        ) : null}
                        {row.label}
                      </td>
                      {visibleHeaderIndices
                        .filter((idx) => idx !== 0)
                        .map((headerIdx) => {
                          const valIndex = headerIdx - 1; // headers[0]은 label, values[0]은 headers[1]에 대응
                          const val = row.values?.[valIndex] ?? '';
                          return (
                            <td
                              key={headerIdx}
                              className={cn(
                                "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 text-right font-bold",
                                getValueColor(val)
                              )}
                            >
                              {formatValue(val)}
                            </td>
                          );
                        })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 영업비 분석 CSV 파싱 및 표시 컴포넌트
function OperatingExpenseSection({ selectedMonth }: { selectedMonth: string }) {
  const [csvData, setCsvData] = React.useState<Record<string, Record<string, string>>>({});
  const [detailNotes, setDetailNotes] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [selectedMonthLocal, setSelectedMonthLocal] = React.useState<string>(selectedMonth || "2025-12");
  const [viewMode, setViewMode] = React.useState<"당월" | "YTD">("당월");
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());
  const [selectedCategoryForPie, setSelectedCategoryForPie] = React.useState<string | null>(null);

  // 월 옵션 (1월부터 12월까지)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      value: `2025-${String(month).padStart(2, '0')}`,
      label: `${month}월`
    };
  });

  React.useEffect(() => {
    setLoading(true);
    const decodeWithBom = async (res: Response) => {
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
        return new TextDecoder('utf-16le').decode(bytes);
      }
      if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
        return new TextDecoder('utf-8').decode(bytes);
      }
      return new TextDecoder('utf-8').decode(bytes);
    };

    Promise.all([
      fetch('/data/operatingexpense.csv').then(res => res.text()),
      fetch('/data/operatingexpense-detail.csv').then(decodeWithBom)
    ])
      .then(([expenseCsv, detailCsv]) => {
        const lines = expenseCsv.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          setLoading(false);
          return;
        }
        
        // 헤더 파싱 (첫 번째 줄)
        const headerLine = lines[0];
        const parsedHeaders = parseCSVLine(headerLine);
        
        // 데이터 파싱
        const data: Record<string, Record<string, string>> = {};
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = parseCSVLine(line);
          if (values.length < 2 || !values[0]) continue;
          
          const dataKey = values[0].trim();
          const rowData: Record<string, string> = {};
          
          // 각 월별 데이터 저장
          for (let j = 1; j < parsedHeaders.length && j < values.length; j++) {
            const monthKey = parsedHeaders[j].trim();
            rowData[monthKey] = values[j].trim();
          }
          
          data[dataKey] = rowData;
        }

        const detailLines = detailCsv
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(Boolean)
          .map((line) => {
            let t = line.trim();
            if (t.includes('\t')) {
              t = t.replace(/\t/g, ',');
            }
            if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
              t = t.slice(1, -1).replace(/""/g, '"');
            }
            return t;
          })
          .filter(Boolean);

        const detailMap: Record<string, string> = {};
        if (detailLines.length > 0) {
          const detailHeaders = parseCSVLine(detailLines[0]).map(h => (h || '').replace(/^\uFEFF/, '').trim());
          const catIdx = detailHeaders.findIndex(h => h === '대분류');
          const subIdx = detailHeaders.findIndex(h => h === '중분류');
          const detailIdx = detailHeaders.findIndex(h => h === '상세');

          if (catIdx >= 0 && detailIdx >= 0) {
            for (let i = 1; i < detailLines.length; i++) {
              const values = parseCSVLine(detailLines[i]);
              const cat = (values[catIdx] || '').trim();
              const sub = subIdx >= 0 ? (values[subIdx] || '').trim() : '';
              const detail = (values[detailIdx] || '').trim();
              if (!cat) continue;
              const key = sub ? `${cat}||${sub}` : cat;
              detailMap[key] = detail;
            }
          }
        }
        
        setCsvData(data);
        setDetailNotes(detailMap);
        setLoading(false);
      })
      .catch(err => {
        console.error('CSV 로드 오류:', err);
        setLoading(false);
      });
  }, []);

  // 선택된 월의 CSV 키 매핑 (2025-10 -> 25년 10월)
  const getMonthKey = (month: string): string => {
    const monthNum = parseInt(month.split('-')[1]);
    return `25년 ${monthNum}월`;
  };

  // 데이터 값 가져오기
  const getDataValue = (dataKey: string, month: string, defaultValue: string = '0'): string => {
    const monthKey = getMonthKey(month);
    if (!csvData[dataKey] || !csvData[dataKey][monthKey]) {
      return defaultValue;
    }
    return csvData[dataKey][monthKey];
  };

  // YTD 값 계산 (1월부터 선택된 월까지 합계)
  const getYTDValue = (dataKey: string, month: string, defaultValue: string = '0'): number => {
    const monthNum = parseInt(month.split('-')[1]);
    let sum = 0;
    let hasValue = false;
    
    for (let i = 1; i <= monthNum; i++) {
      const monthKey = `25년 ${i}월`;
      if (csvData[dataKey] && csvData[dataKey][monthKey]) {
        const val = csvData[dataKey][monthKey].replace(/[^0-9.-]/g, '');
        const num = parseFloat(val);
        if (!isNaN(num)) {
          sum += num;
          hasValue = true;
        }
      }
    }
    
    if (!hasValue) return parseFloat(defaultValue) || 0;
    return sum;
  };

  // 24년 당월 값 가져오기
  const get24MonthValue = (dataKey: string, month: string): number => {
    const monthNum = parseInt(month.split('-')[1]);
    const monthKey = `24년 ${monthNum}월`;
    if (csvData[dataKey] && csvData[dataKey][monthKey]) {
      const val = csvData[dataKey][monthKey].replace(/[^0-9.-]/g, '');
      return parseFloat(val) || 0;
    }
    return 0;
  };

  // 24년 YTD 값 계산 (24년 데이터 키 사용)
  const get24YTDValue = (dataKey: string, month: string): number => {
    const monthNum = parseInt(month.split('-')[1]);
    let sum = 0;
    
    // 24년 데이터는 같은 키에 24년 월별 컬럼으로 저장됨
    for (let i = 1; i <= monthNum; i++) {
      const monthKey = `24년 ${i}월`;
      if (csvData[dataKey] && csvData[dataKey][monthKey]) {
        const val = csvData[dataKey][monthKey].replace(/[^0-9.-]/g, '');
        const num = parseFloat(val);
        if (!isNaN(num)) {
          sum += num;
        }
      }
    }
    
    return sum;
  };

  // 현재 표시할 값 (YTD 또는 당월)
  const getCurrentValue = (dataKey: string, month: string): number => {
    if (viewMode === "YTD") {
      return getYTDValue(dataKey, month);
    } else {
      const val = getDataValue(dataKey, month, '0');
      return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
    }
  };

  // 현재 월 숫자
  const currentMonthNum = parseInt(selectedMonthLocal.split('-')[1]);

  // KPI 데이터
  const totalOperatingExpense = getCurrentValue('영업비_총영업비', selectedMonthLocal);
  const totalOperatingExpense24 = viewMode === "YTD" ? get24YTDValue('영업비_총영업비', selectedMonthLocal) : get24MonthValue('영업비_총영업비', selectedMonthLocal);
  const totalOperatingExpenseYOY = totalOperatingExpense24 > 0 ? (totalOperatingExpense / totalOperatingExpense24 * 100) : 0;

  const personnelCost = getCurrentValue('영업비_인건비', selectedMonthLocal);
  const personnelCostRatio = totalOperatingExpense > 0 ? (personnelCost / totalOperatingExpense * 100) : 0;

  const headcount = getCurrentValue('영업비_인원수', selectedMonthLocal) || 26;
  
  // 인당 영업비 (인당 인건비): 정규직 + 계약직 급여 / 인원수
  const regularSalary = getCurrentValue('영업비_인건비_정규직인건비', selectedMonthLocal);
  const contractSalary = getCurrentValue('영업비_인건비_계약직인건비', selectedMonthLocal);
  const salarySum = regularSalary + contractSalary;
  const perPersonExpense = headcount > 0 ? salarySum / headcount : 0;

  const sales = getCurrentValue('영업비_매출', selectedMonthLocal);
  const efficiencyRatio = sales > 0 ? (totalOperatingExpense / sales * 100) : 0;

  // 계정별 비용 데이터
  const accountCategories = [
    { key: '인건비', name: '인건비' },
    { key: '광고선전비', name: '광고선전비' },
    { key: '지급수수료', name: '지급수수료' },
    { key: '식대출장비', name: '식대/출장비' },
    { key: '사무실임차료', name: '사무실임차료' },
    { key: '샘플개발비', name: '샘플/개발비' },
    { key: '감가상각비', name: '감가상각비' },
    { key: '기타비용', name: '기타비용' },
  ];

  // 대분류별 중분류 매핑
  const subCategoriesMap: Record<string, { key: string; name: string }[]> = {
    '인건비': [
      { key: '정규직인건비', name: '정규직인건비' },
      { key: '계약직인건비', name: '계약직인건비' },
      { key: '해고급여', name: '해고급여' },
      { key: '급여관련충당금', name: '급여관련충당금' },
      { key: 'PTO', name: 'PTO(퇴직자 휴가급여)' },
      { key: '기타복후비', name: '기타복후비' },
      { key: '직원복리후생비', name: '직원복후비' },
      { key: '직원보험', name: '직원보험' },
      { key: '커미션', name: '커미션' },
    ],
    '광고선전비': [
      { key: 'Photography', name: 'Photography' },
      { key: 'Advertising', name: 'Advertising' },
      { key: 'SEM브랜드마케팅', name: 'SEM 브랜드 마케팅' },
      { key: 'Events', name: 'Events' },
      { key: 'Model', name: 'Model' },
      { key: 'Seeding', name: 'Seeding' },
    ],
    '지급수수료': [
      { key: '리크루팅서비스', name: '리크루팅서비스' },
      { key: '페이롤서비스', name: '페이롤서비스' },
      { key: '회계법률서비스', name: '회계법률서비스' },
      { key: '전문용역비', name: '전문용역비(기타전문용역비)' },
      { key: '보험료', name: '보험료' },
      { key: '소프트웨어사용비', name: '소프트웨어 사용비' },
      { key: '결제수수료', name: '결제수수료' },
      { key: '멤버쉽', name: '멤버쉽' },
    ],
    '식대/출장비': [],
    '사무실임차료': [],
    '샘플/개발비': [
      { key: '원단소재샘플', name: '원단 & 소재샘플' },
      { key: '개발모델피팅', name: '개발 모델 피팅' },
      { key: '상품개발비', name: '상품 개발비' },
      { key: '샘플비', name: '샘플비' },
    ],
    '감가상각비': [],
    '기타비용': [
      { key: '기타버퍼비용', name: '기타 버퍼 비용' },
      { key: '수도광열비', name: '수도광열비' },
      { key: '매출채널외운반비', name: '매출채널 외 운반비' },
      { key: '전화', name: '전화' },
      { key: '대손상각비', name: '대손상각비' },
      { key: '재고평가감', name: '재고평가감' },
      { key: '세금과공과', name: '세금과공과' },
    ],
  };

  const year24Label = viewMode === "YTD" ? "24년 YTD" : `24년 ${currentMonthNum}월`;
  const year25Label = viewMode === "YTD" ? "25년 YTD" : `25년 ${currentMonthNum}월`;
  
  const chartData = accountCategories.map(cat => ({
    name: cat.name,
    [year24Label]: viewMode === "YTD" ? get24YTDValue(`영업비_${cat.key}`, selectedMonthLocal) : get24MonthValue(`영업비_${cat.key}`, selectedMonthLocal),
    [year25Label]: viewMode === "YTD" ? getYTDValue(`영업비_${cat.key}`, selectedMonthLocal) : getCurrentValue(`영업비_${cat.key}`, selectedMonthLocal),
  }));

  // 선택된 대분류에 따른 파이 차트 데이터
  const getPieChartData = () => {
    const categoryName = selectedCategoryForPie || '인건비'; // 기본값: 인건비
    const subCats = subCategoriesMap[categoryName] || [];
    const categoryKey = accountCategories.find(c => c.name === categoryName)?.key || '';
    const totalValue = getCurrentValue(`영업비_${categoryKey}`, selectedMonthLocal);
    
    if (totalValue === 0) {
      return [];
    }
    
    // 하위항목이 없으면 대분류 자체를 단일 항목으로 표시
    if (!subCats.length) {
      return [{
        name: categoryName,
        value: totalValue,
        percentage: '100',
      }];
    }
    
    // 하위항목이 있으면 하위항목들을 표시
    return subCats.map(item => {
      const dataKey = `영업비_${categoryKey}_${item.key}`;
      const val = getCurrentValue(dataKey, selectedMonthLocal);
      return {
        name: item.name,
        value: val,
        percentage: totalValue > 0 ? (val / totalValue * 100).toFixed(0) : '0',
      };
    }).filter(item => item.value > 0);
  };

  const pieData = getPieChartData();
  const COLORS = [
    '#1e293b', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', 
    '#3b82f6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', 
    '#84cc16', '#d946ef', '#14b8a6', '#eab308', '#a855f7',
    '#f43f5e', '#22c55e', '#64748b', '#0ea5e9', '#d946ef'
  ];

  // 대분류별 상세 테이블 데이터
  const detailTableData = accountCategories.map(cat => {
    const val25 = viewMode === "YTD" ? getYTDValue(`영업비_${cat.key}`, selectedMonthLocal) : getCurrentValue(`영업비_${cat.key}`, selectedMonthLocal);
    const val24 = viewMode === "YTD" ? get24YTDValue(`영업비_${cat.key}`, selectedMonthLocal) : get24MonthValue(`영업비_${cat.key}`, selectedMonthLocal);
    const diff = val25 - val24;
    const diffRate = val24 > 0 ? (diff / val24 * 100) : 0;
    const detail = detailNotes[cat.name] || '';
    
    return {
      name: cat.name,
      ytd24: val24,
      ytd25: val25,
      diff: diff,
      diffRate: diffRate,
      detail: detail,
    };
  });

  const totalRow = {
    name: '합계',
    ytd24: totalOperatingExpense24,
    ytd25: totalOperatingExpense,
    diff: totalOperatingExpense - totalOperatingExpense24,
    diffRate: totalOperatingExpenseYOY - 100,
    detail: '',
  };

  const toggleCategory = (name: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(name)) {
      newExpanded.delete(name);
      // 축소할 때 파이 차트도 초기화
      if (selectedCategoryForPie === name) {
        setSelectedCategoryForPie(null);
      }
    } else {
      newExpanded.add(name);
      // 확장할 때 파이 차트에 반영
      setSelectedCategoryForPie(name);
    }
    setExpandedCategories(newExpanded);
  };

  // 중분류 데이터 가져오기
  const getSubCategoryData = (categoryName: string) => {
    const categoryKey = accountCategories.find(c => c.name === categoryName)?.key || '';
    const subCats = subCategoriesMap[categoryName] || [];
    
    return subCats.map(sub => {
      const dataKey = `영업비_${categoryKey}_${sub.key}`;
      const val25 = viewMode === "YTD" ? getYTDValue(dataKey, selectedMonthLocal) : getCurrentValue(dataKey, selectedMonthLocal);
      const val24 = viewMode === "YTD" ? get24YTDValue(dataKey, selectedMonthLocal) : get24MonthValue(dataKey, selectedMonthLocal);
      const diff = val25 - val24;
      const diffRate = val24 > 0 ? (diff / val24 * 100) : 0;
      const detailKey = `${categoryName}||${sub.name}`;
      const detail = detailNotes[detailKey] || '';
      
      return {
        name: sub.name,
        ytd24: val24,
        ytd25: val25,
        diff: diff,
        diffRate: diffRate,
        detail: detail,
      };
    });
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">데이터를 불러오는 중...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 영역 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold mb-1">STO 영업비 분석</CardTitle>
              <CardDescription className="text-sm">
                {viewMode === "YTD" ? "24년 YTD vs 25년 YTD (단위: K $)" : "24년 당월 vs 25년 당월 (단위: K $)"}
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={selectedMonthLocal} onValueChange={setSelectedMonthLocal}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                <Button
                  variant={viewMode === "YTD" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("YTD")}
                  className={cn("h-9 text-xs px-3", viewMode === "YTD" ? "bg-slate-800 hover:bg-slate-900" : "")}
                >
                  YTD ({currentMonthNum}월)
                </Button>
                <Button
                  variant={viewMode === "당월" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("당월")}
                  className={cn("h-9 text-xs px-3", viewMode === "당월" ? "bg-slate-800 hover:bg-slate-900" : "")}
                >
                  당월 ({currentMonthNum}월)
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 상단 KPI 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">총 영업비</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">${totalOperatingExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}K</div>
            <div className={cn("text-sm font-medium", totalOperatingExpenseYOY >= 100 ? "text-red-600" : "text-emerald-600")}>
              YOY {totalOperatingExpenseYOY.toFixed(0)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">인건비 비중</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{personnelCostRatio.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">전체 비용 중</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">인당 영업비</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">${perPersonExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}K</div>
            <div className="text-xs text-gray-500">{headcount}명 연간</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">효율성 지표</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">{efficiencyRatio.toFixed(1)}%</div>
            <div className="text-xs text-gray-500">매출 대비</div>
          </CardContent>
        </Card>
      </div>

      {/* 하단 차트 영역 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 계정별 비용 비교 막대 그래프 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">계정별 비용 비교</CardTitle>
              <Button variant="outline" size="sm" className="h-7 text-xs">{viewMode === "YTD" ? "YTD 분석" : "당월 분석"}</Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={chartData}
                onClick={(data: any) => {
                  // 클릭된 데이터 포인트 찾기
                  let clickedCategory: string | null = null;
                  if (data && data.activeLabel) {
                    clickedCategory = data.activeLabel;
                  } else if (data && data.activePayload && data.activePayload[0] && data.activePayload[0].payload) {
                    clickedCategory = data.activePayload[0].payload.name;
                  }
                  
                  if (clickedCategory) {
                    setSelectedCategoryForPie(clickedCategory);
                    // 해당 카테고리만 열고 다른 항목들은 모두 접기
                    setExpandedCategories(new Set([clickedCategory]));
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={11} />
                <YAxis 
                  label={{ value: 'K $', angle: -90, position: 'insideLeft' }} 
                  fontSize={11}
                  tickFormatter={(value) => value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}K`} />
                <Legend />
                <Bar 
                  dataKey={year24Label} 
                  fill="#e5e7eb"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-24-${index}`} 
                      fill="#e5e7eb"
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
                <Bar 
                  dataKey={year25Label} 
                  fill="#374151"
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-25-${index}`} 
                      fill="#374151"
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 세부내역 파이 차트 (동적 변경) */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">
                {selectedCategoryForPie ? `${selectedCategoryForPie} 세부내역` : '인건비 세부내역'}
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => {
                  setSelectedCategoryForPie(null);
                  setExpandedCategories(new Set());
                }}
              >
                닫기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="40%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => parseFloat(entry.percentage) >= 5 ? `${entry.percentage}%` : ''}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [`$${value.toFixed(0)}K (${props.payload.percentage}%)`, name]} />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: "11px", maxWidth: "45%" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                데이터가 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 대분류별 영업비 상세 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold">대분류별 영업비 상세</CardTitle>
          <CardDescription className="text-xs">클릭하여 세부 항목 보기</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">대분류</TableHead>
                  <TableHead className="text-right w-[90px]">{year24Label}</TableHead>
                  <TableHead className="text-right w-[90px]">{year25Label}</TableHead>
                  <TableHead className="text-right w-[90px]">증감액</TableHead>
                  <TableHead className="text-right w-[90px]">증감률</TableHead>
                  <TableHead className="text-center w-[280px]">상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detailTableData.map((row) => (
                  <React.Fragment key={row.name}>
                    <TableRow 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleCategory(row.name)}
                    >
                      <TableCell className="font-medium w-[140px]">
                        <div className="flex items-center gap-2">
                          {expandedCategories.has(row.name) ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                          {row.name}
                        </div>
                      </TableCell>
                      <TableCell className="text-right w-[90px]">${row.ytd24.toLocaleString(undefined, { maximumFractionDigits: 0 })}K</TableCell>
                      <TableCell className="text-right w-[90px]">${row.ytd25.toLocaleString(undefined, { maximumFractionDigits: 0 })}K</TableCell>
                      <TableCell className={cn("text-right font-medium w-[90px]", row.diff >= 0 ? "text-red-600" : "text-green-600")}>
                        {row.diff >= 0 ? '+' : ''}${row.diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}K
                      </TableCell>
                      <TableCell className={cn("text-right font-medium w-[90px]", row.diffRate >= 0 ? "text-red-600" : "text-green-600")}>
                        {row.diffRate >= 0 ? '+' : ''}{row.diffRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-left w-[280px]">{row.detail}</TableCell>
                    </TableRow>
                    {/* 확장된 세부 항목 표시 */}
                    {expandedCategories.has(row.name) && getSubCategoryData(row.name).map((subRow) => (
                      <TableRow key={`${row.name}-${subRow.name}`} className="bg-gray-50">
                        <TableCell className="font-medium pl-8 w-[140px]">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">└</span>
                            {subRow.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-right w-[90px]">${subRow.ytd24.toLocaleString(undefined, { maximumFractionDigits: 0 })}K</TableCell>
                        <TableCell className="text-right w-[90px]">${subRow.ytd25.toLocaleString(undefined, { maximumFractionDigits: 0 })}K</TableCell>
                        <TableCell className={cn("text-right font-medium w-[90px]", subRow.diff >= 0 ? "text-red-600" : "text-green-600")}>
                          {subRow.diff >= 0 ? '+' : ''}${subRow.diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}K
                        </TableCell>
                        <TableCell className={cn("text-right font-medium w-[90px]", subRow.diffRate >= 0 ? "text-red-600" : "text-green-600")}>
                          {subRow.diffRate >= 0 ? '+' : ''}{subRow.diffRate.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-left w-[280px]">{subRow.detail}</TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                <TableRow className="bg-blue-50 font-bold">
                  <TableCell className="font-bold w-[140px]">{totalRow.name}</TableCell>
                  <TableCell className="text-right font-bold w-[90px]">${totalRow.ytd24.toLocaleString(undefined, { maximumFractionDigits: 0 })}K</TableCell>
                  <TableCell className="text-right font-bold w-[90px]">${totalRow.ytd25.toLocaleString(undefined, { maximumFractionDigits: 0 })}K</TableCell>
                  <TableCell className={cn("text-right font-bold w-[90px]", totalRow.diff >= 0 ? "text-red-600" : "text-green-600")}>
                    {totalRow.diff >= 0 ? '+' : ''}${totalRow.diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}K
                  </TableCell>
                  <TableCell className={cn("text-right font-bold w-[90px]", totalRow.diffRate >= 0 ? "text-red-600" : "text-green-600")}>
                    {totalRow.diffRate >= 0 ? '+' : ''}{totalRow.diffRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-left font-bold w-[280px]">{totalRow.detail}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const workingCapitalParents = ['운전자본', '현금/차입금', '기타운전자본', '기타자산/부채', '자본', '자산-부채'];

// 재무상태표 CSV 파싱 및 표시 컴포넌트
function BalanceSheetSection({ selectedMonth }: { selectedMonth: string }) {
  const [csvData, setCsvData] = React.useState<any[]>([]);
  const [workingCapitalData, setWorkingCapitalData] = React.useState<any[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  // 초기 상태: 모든 항목 닫힘
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = React.useState(false);
  const [showAllMonths, setShowAllMonths] = React.useState(false);

  // 운전자본 표 확장 상태 관리 (기본값: '운전자본', '현금/차입금' 펼침)
  const [workingCapitalExpanded, setWorkingCapitalExpanded] = React.useState<Set<string>>(new Set(['운전자본', '현금/차입금']));

  const toggleWorkingCapitalCategory = (category: string) => {
    const newSet = new Set(workingCapitalExpanded);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setWorkingCapitalExpanded(newSet);
  };

  const toggleAllWorkingCapital = () => {
    const allOpen = workingCapitalParents.every(p => workingCapitalExpanded.has(p));
    if (allOpen) {
      setWorkingCapitalExpanded(new Set());
    } else {
      setWorkingCapitalExpanded(new Set(workingCapitalParents));
    }
  };

  React.useEffect(() => {
    setLoading(true);
    // CSV 파일 읽기
    fetch('/data/balance-sheet.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          setLoading(false);
          return;
        }
        
        // 헤더 파싱 (두 번째 줄)
        const headerLine = lines[1];
        const parsedHeaders = parseCSVLine(headerLine);
        // 첫 번째 열(구분) 제외하고 모든 열 추출
        let dataHeaders = parsedHeaders.slice(1).filter(h => h && h.trim() !== '');
        
        // 24-Nov를 Nov-25F/A 앞으로 이동 (이미 존재하면 이동, 없으면 생성 후 이동)
        let novIndex = dataHeaders.findIndex(h => h && h.trim() === 'Nov-25F');
        if (novIndex === -1) {
            novIndex = dataHeaders.findIndex(h => h && h.trim() === 'Nov-25A');
        }
        const existing24NovIndex = dataHeaders.findIndex(h => h && h.trim() === '24-Nov');
        
        if (novIndex >= 0) {
          if (existing24NovIndex >= 0) {
            // 이미 존재하면 제거하고 Nov-25F/A 앞으로 삽입
            if (existing24NovIndex !== novIndex - 1) {
              const removed = dataHeaders.splice(existing24NovIndex, 1)[0];
              // 제거 후 novIndex 다시 찾기
              let newNovIndex = dataHeaders.findIndex(h => h && h.trim() === 'Nov-25F');
              if (newNovIndex === -1) newNovIndex = dataHeaders.findIndex(h => h && h.trim() === 'Nov-25A');
              
              if (newNovIndex >= 0) {
                dataHeaders.splice(newNovIndex, 0, removed);
              }
            }
          } else {
            // 없으면 새로 추가
            dataHeaders.splice(novIndex, 0, '24-Nov');
          }
        }
        
        // 24-Dec를 Dec-25F/A 앞으로 이동
        let decIndex = dataHeaders.findIndex(h => h && h.trim() === 'Dec-25F');
        if (decIndex === -1) decIndex = dataHeaders.findIndex(h => h && h.trim() === 'Dec-25A');
        const existing24DecIndex = dataHeaders.findIndex(h => h && h.trim() === '24-Dec');
        
        if (decIndex >= 0) {
          if (existing24DecIndex >= 0) {
            if (existing24DecIndex !== decIndex - 1) {
              const removed = dataHeaders.splice(existing24DecIndex, 1)[0];
              let newDecIndex = dataHeaders.findIndex(h => h && h.trim() === 'Dec-25F');
              if (newDecIndex === -1) newDecIndex = dataHeaders.findIndex(h => h && h.trim() === 'Dec-25A');
              
              if (newDecIndex >= 0) {
                dataHeaders.splice(newDecIndex, 0, removed);
              }
            }
          } else {
            dataHeaders.splice(decIndex, 0, '24-Dec');
          }
        }
        
        // 24-Dec 뒤에 Dec YoY 추가 (이미 있으면 추가하지 않음)
        const dec24Index = dataHeaders.findIndex(h => h && h.trim() === '24-Dec');
        if (dec24Index >= 0 && !dataHeaders.includes('Dec YoY')) {
          dataHeaders.splice(dec24Index + 1, 0, 'Dec YoY');
        }
        
        // Dec YoY 뒤에 비고 추가 (원본 CSV에 비고가 없을 경우만)
        const hasNoteInOriginal = parsedHeaders.some(h => h && h.trim() === '비고');
        if (!hasNoteInOriginal && !dataHeaders.includes('비고')) {
             const decYoyIndex = dataHeaders.findIndex(h => h && h.trim() === 'Dec YoY');
             if (decYoyIndex >= 0) {
                  dataHeaders.splice(decYoyIndex + 1, 0, '비고');
             } else if (dec24Index >= 0) {
                  dataHeaders.splice(dec24Index + 1, 0, '비고');
             }
        }
        
        setHeaders(['구분', ...dataHeaders]);
        
        // 데이터 파싱
        const parsed: any[] = [];
        const workingCapital: any[] = [];
        let currentParent: any = null;
        let currentSubParent: any = null;
        let isWorkingCapitalSection = false;
        
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim() || line.match(/^,{10,}/)) continue; // 빈 줄 스킵
          
          // 새로운 섹션 시작 체크 (운전자본 섹션)
          if (line.startsWith('구분,')) {
            isWorkingCapitalSection = true;
            continue; // 헤더 라인 스킵
          }
          
          const values = parseCSVLine(line);
          if (values.length < 2 || !values[0]) continue;
          
          const label = values[0].trim();
          
          // 모든 월 데이터 추출 및 매핑 (구분 열 제외)
          const csvValues = values.slice(1);
          const csvHeaders = parsedHeaders.slice(1);
          const monthValues: string[] = [];
          
          for (const header of dataHeaders) {
            const dTrim = header.trim();
            // CSV 헤더에서 해당 컬럼 찾기
            const csvIndex = csvHeaders.findIndex(h => {
               if (!h) return false;
               const hTrim = h.trim();
               return hTrim === dTrim;
            });
            
            if (csvIndex >= 0) {
              // 비고 컬럼의 경우, 마지막 쉼표 뒤의 빈 값이 있을 수 있으므로 인덱스 범위 체크
              if (csvIndex < csvValues.length) {
                monthValues.push(csvValues[csvIndex]);
              } else {
                // 인덱스가 범위를 벗어나면 빈 문자열
                monthValues.push('');
              }
            } else {
              monthValues.push('');
            }
          }
          
          // 각 월별 값 정제
          const cleanedValues = monthValues.map((val: string, idx: number) => {
            // 비고 컬럼인지 확인
            const currentHeader = dataHeaders[idx];
            const isNoteColumn = currentHeader && currentHeader.trim() === '비고';
            if (isNoteColumn) {
              // 비고 컬럼은 따옴표만 제거하고 나머지는 그대로 유지
              // 값이 없거나 빈 문자열이면 빈 문자열 반환
              if (!val || val.trim() === '') return '';
              // 따옴표 제거 (앞뒤 따옴표만)
              let cleaned = val.trim();
              if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
                cleaned = cleaned.slice(1, -1);
              }
              return cleaned;
            }
            // 일반 컬럼은 기존 로직대로 처리
            let cleaned = val.replace(/[$,"]/g, '').trim();
            if (cleaned === '-' || !cleaned || cleaned === '') return '';
            return cleaned;
          });
          
          // 운전자본 섹션 처리
          if (isWorkingCapitalSection) {
            const cleanLabel = label;
            workingCapital.push({
              label: cleanLabel,
              values: cleanedValues
            });
            continue;
          }
          
          // 재무상태표 본문 처리
          // 메인 카테고리인지 확인 (숫자.로 시작)
          const isMainCategory = /^[0-9]+\./.test(label);
          
          // 서브 카테고리인지 확인 ((숫자)로 시작)
          const isSubCategory = /^\([0-9]+\)/.test(label);
          
          // 하위 항목인지 확인
          const isSubItem = !isMainCategory && !isSubCategory && 
                           !label.match(/^[0-9]+\./) &&
                           !label.match(/^\([0-9]+\)/);
          
          const cleanLabel = label.replace(/^[0-9]+\./, '').replace(/^\([0-9]+\)/, '').trim();
          const isMain = isMainCategory || ['부채총계'].includes(cleanLabel);
          
          // 카테고리 키 생성
          let categoryKey: string | null = null;
          if (isMainCategory) {
            categoryKey = cleanLabel;
            currentParent = cleanLabel;
            currentSubParent = null;
          } else if (isSubCategory) {
            categoryKey = `${currentParent} - ${cleanLabel}`;
            currentSubParent = cleanLabel;
          } else if (isSubItem) {
            // 서브 카테고리가 있으면 서브 카테고리 키, 없으면 부모 카테고리 키 사용
            categoryKey = currentSubParent ? `${currentParent} - ${currentSubParent}` : null;
          }
          
          // 계산 결과 항목인지 확인 (토글 없음)
          const isCalculationResult = ['매출총이익', '직접이익', '영업이익'].includes(cleanLabel);
          
          parsed.push({
            label: cleanLabel,
            values: cleanedValues,
            isMainCategory: isMain,
            isSubCategory: isSubCategory,
            isSubItem,
            parentCategory: isSubItem ? (currentSubParent || currentParent) : null,
            categoryKey: (isMain || isSubCategory) && !isCalculationResult ? categoryKey : null,
            indentLevel: isSubItem ? 2 : isSubCategory ? 1 : 0,
            isCalculationResult
          });
        }
        
        setCsvData(parsed);
        setWorkingCapitalData(workingCapital);
        setLoading(false);
      })
      .catch(err => {
        console.error('CSV 로드 오류:', err);
        setLoading(false);
      });
  }, []);

  const formatValue = (value: string, isNoteColumn: boolean = false) => {
    if (!value || value === '' || value === '-') return '-';
    
    // 비고 컬럼은 원본 텍스트 그대로 반환
    if (isNoteColumn) {
      return value;
    }
    
    // 퍼센트 값 처리
    if (value.includes('%')) {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return `${num.toFixed(1)}%`;
      }
      return value;
    }
    
    // 특수 문자 처리 (△, +)
    if (value.includes('△') || value.startsWith('+')) {
      return value;
    }
    
    // 괄호로 감싸진 음수 처리 (예: ($12,853))
    if (value.includes('(') && value.includes(')')) {
      const cleaned = value.replace(/[($)]/g, '').replace(/,/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        return `(${num.toLocaleString()})`;
      }
    }
    
    const num = parseFloat(value.replace(/,/g, ''));
    if (isNaN(num)) return value;
    if (num < 0) return `(${Math.abs(num).toLocaleString()})`;
    return num.toLocaleString();
  };

  const getValueColor = (value: string) => {
    if (!value || value === '' || value === '-') return '';
    
    // 괄호로 감싸진 음수 체크
    if (value.includes('(') && value.includes(')')) {
      return "text-red-600";
    }
    
    const num = parseFloat(value.replace(/,/g, '').replace(/[%p]/g, ''));
    if (!isNaN(num) && num < 0 && !value.includes('△')) {
      return "text-red-600";
    }
    return "";
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedCategories(new Set());
      setAllExpanded(false);
    } else {
      const allCategories = csvData
        .filter(row => (row.isMainCategory || row.isSubCategory) && row.categoryKey)
        .map(row => row.categoryKey);
      setExpandedCategories(new Set(allCategories));
      setAllExpanded(true);
    }
  };

  // 필터링된 데이터 (접힌 항목 제외)
  const filteredData = React.useMemo(() => {
    const result: any[] = [];
    let currentCategory: string | null = null;
    let currentSubCategory: string | null = null;
    
    for (const row of csvData) {
      if (row.isMainCategory) {
        currentCategory = row.categoryKey;
        currentSubCategory = null;
        result.push(row);
      } else if (row.isSubCategory) {
        currentSubCategory = row.categoryKey;
        // 서브 카테고리는 부모가 펼쳐져 있을 때만 표시
        if (currentCategory && expandedCategories.has(currentCategory)) {
          result.push(row);
        }
      } else if (row.isSubItem) {
        // 하위 항목은 부모 서브 카테고리가 펼쳐져 있을 때만 표시
        if (currentSubCategory && expandedCategories.has(currentSubCategory)) {
          result.push(row);
        } else if (currentCategory && expandedCategories.has(currentCategory) && !currentSubCategory) {
          // 서브 카테고리가 없는 경우 (직접 메인 카테고리 아래 항목) 부모만 체크
          result.push(row);
        }
      } else {
        // 일반 항목 (운전자본 등)은 항상 표시
        result.push(row);
      }
    }
    
    return result;
  }, [csvData, expandedCategories]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">데이터를 불러오는 중...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 재무상태표 본문 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">STO 재무상태표 (단위 : K $)</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAllMonths(!showAllMonths)}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
            >
              {showAllMonths ? "월 접기" : "월 펼치기"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAll}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
            >
              {allExpanded ? "접기" : "열기"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.filter((_: any, idx: number) => {
                    if (showAllMonths) return true;
                    // Keep first column (구분) and columns starting from Nov
                    // After adding YoY: 0=구분, 1=Jan, ..., 10=Oct, 11=Nov, 12=YoY, 13=Dec
                    // We want to hide indices 1 to 10 (Jan to Oct), keep everything from Nov onwards
                    return idx === 0 || idx >= 11;
                  }).map((header, idx) => {
                    let displayHeader = header;
                    if (header !== '구분') {
                      // Nov-25F → 25-Nov, Dec-25F → 25-Dec로 변경
                      if (header === 'Nov-25F' || header === 'Nov') {
                        displayHeader = '25-Nov';
                      } else if (header === 'Dec-25F' || header === 'Dec') {
                        displayHeader = '25-Dec';
                      } else if (header.startsWith('24-Nov') || header === '24-Nov') {
                        displayHeader = '24-Nov';
                      } else if (header.startsWith('24-Dec') || header === '24-Dec') {
                        displayHeader = '24-Dec';
                      } else if (header === 'Dec YoY') {
                        displayHeader = 'Dec YoY';
                      } else {
                        displayHeader = header.replace('-25A', '').replace('-25F', '(예상)');
                      }
                    }
                    
                    // 세트별 배경색 및 구분선 설정
                    // 첫 번째 세트: 24-Nov, Nov, Nov YoY
                    const isSet1Start = header === '24-Nov';
                    const isSet1 = header === 'Nov-25F' || header === 'Nov' || 
                                  header === '24-Nov' || header === 'Nov YoY';
                    const isSet1End = header === 'Nov YoY';
                    
                    // 두 번째 세트: 24-Dec, Dec, Dec YoY
                    const isSet2Start = header === '24-Dec';
                    const isSet2 = header === 'Dec-25F' || header === 'Dec' || 
                                  header === '24-Dec' || header === 'Dec YoY';
                    const isSet2End = header === 'Dec YoY';
                    
                    // 세트 구분을 위한 스타일 - 세트 사이에만 구분선 (회색으로 통일)
                    let setStyle = "";
                    const borderClass = "border-gray-500";
                    
                    if (isSet1) {
                      if (isSet1Start) {
                        setStyle += ` border-l-2 ${borderClass}`;
                      }
                      if (isSet1End) {
                        setStyle += ` border-r-2 ${borderClass}`;
                      }
                    } else if (isSet2) {
                      if (isSet2Start) {
                        setStyle += ` border-l-2 ${borderClass}`;
                      }
                      if (isSet2End) {
                        setStyle += ` border-r-2 ${borderClass}`;
                      }
                    }
                    
                    return (
                      <TableHead 
                        key={idx} 
                        className={cn(
                          header === '구분' ? "w-[250px] font-bold text-left" : 
                          header.includes('비고') ? "text-center font-bold w-[300px]" :
                          "text-center font-bold w-[110px]",
                          setStyle
                        )}
                      >
                        {displayHeader}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, idx) => {
                  const isExpanded = row.categoryKey ? expandedCategories.has(row.categoryKey) : false;
                  
                  return (
                    <TableRow 
                      key={idx}
                      className={cn(
                        row.isMainCategory ? "bg-gray-100 cursor-pointer" : 
                        row.isSubCategory ? "bg-gray-50 cursor-pointer" :
                        row.isSubItem ? "bg-white" : "",
                        "hover:bg-gray-50"
                      )}
                      onClick={() => (row.isMainCategory || row.isSubCategory) && row.categoryKey && toggleCategory(row.categoryKey)}
                    >
                      <TableCell className={cn(
                        row.isMainCategory ? "font-bold text-base" : 
                        row.isSubCategory ? "font-bold text-sm pl-4" :
                        "font-medium",
                        row.isSubItem ? "pl-8 text-sm" : "",
                        (row.isMainCategory || row.isSubCategory) && "flex items-center gap-2"
                      )}>
                        {(row.isMainCategory || row.isSubCategory) && row.categoryKey && (
                          <span className="text-xs">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        )}
                        {row.label}
                      </TableCell>
                      {(() => {
                        const filteredHeaders = headers.filter((_: any, idx: number) => {
                          if (showAllMonths) return true;
                          return idx === 0 || idx >= 11;
                        });
                        
                        const filteredValues = row.values.filter((_: any, colIdx: number) => {
                          if (showAllMonths) return true;
                          // After adding YoY: values array has 13 elements
                          // 0-9: Jan to Oct, 10: Nov, 11: YoY, 12: Dec
                          // We want to hide indices 0 to 9 (Jan to Oct), keep everything from Nov onwards
                          return colIdx > 9;
                        });
                        
                        return filteredValues.map((value: string, colIdx: number) => {
                          // 헤더 인덱스는 colIdx + 1 (구분 컬럼 제외)
                          const headerIdx = colIdx + 1;
                          const currentHeader = filteredHeaders[headerIdx];
                          
                          // 세트별 배경색 설정 (헤더와 동일)
                          const isSet1Start = currentHeader === '24-Nov';
                          const isSet1 = currentHeader === 'Nov-25F' || currentHeader === 'Nov' || 
                                        currentHeader === '24-Nov' || currentHeader === 'Nov YoY';
                          const isSet1End = currentHeader === 'Nov YoY';
                          
                          const isSet2Start = currentHeader === '24-Dec';
                          const isSet2 = currentHeader === 'Dec-25F' || currentHeader === 'Dec' || 
                                        currentHeader === '24-Dec' || currentHeader === 'Dec YoY';
                          const isSet2End = currentHeader === 'Dec YoY';
                          
                          let setStyle = "";
                          const borderClass = "border-gray-500";
                          
                          if (isSet1) {
                            if (isSet1Start) {
                              setStyle += ` border-l-2 ${borderClass}`;
                            }
                            if (isSet1End) {
                              setStyle += ` border-r-2 ${borderClass}`;
                            }
                          } else if (isSet2) {
                            if (isSet2Start) {
                              setStyle += ` border-l-2 ${borderClass}`;
                            }
                            if (isSet2End) {
                              setStyle += ` border-r-2 ${borderClass}`;
                            }
                          }
                          
                          const isNoteColumn = currentHeader === '비고';
                          let displayValue = formatValue(value, isNoteColumn);
                          let cellColorClass = isNoteColumn ? "" : getValueColor(value);
                          let highlightClass = "";
                          
                          // Nov YoY, Dec YoY 컬럼 처리 (비고 컬럼 제외)
                          if (!isNoteColumn && (currentHeader === 'Nov YoY' || currentHeader === 'Dec YoY')) {
                            // 1. 소수점 제거 (.0%)
                            if (displayValue.endsWith('.0%')) {
                              displayValue = displayValue.replace('.0%', '%');
                            }
                          }
                          
                          return (
                            <TableCell 
                              key={colIdx}
                              className={cn(
                                isNoteColumn ? "text-left font-bold w-[300px] whitespace-nowrap" : "text-right font-medium w-[110px]",
                                cellColorClass,
                                setStyle,
                                highlightClass
                              )}
                            >
                              {displayValue}
                            </TableCell>
                          );
                        });
                      })()}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* 운전자본 섹션 */}
      {workingCapitalData.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">STO 운전자본 (단위 : K $)</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleAllWorkingCapital}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
            >
              {workingCapitalParents.every(p => workingCapitalExpanded.has(p)) ? "접기" : "열기"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.filter((_: any, idx: number) => {
                      if (showAllMonths) return true;
                      // Keep first column (구분) and columns starting from Nov
                      // After adding YoY: 0=구분, 1=Jan, ..., 10=Oct, 11=Nov, 12=YoY, 13=Dec
                      // We want to hide indices 1 to 10 (Jan to Oct), keep everything from Nov onwards
                      return idx === 0 || idx >= 11;
                    }).map((header, idx) => {
                      let displayHeader = header;
                      if (header !== '구분') {
                        // Nov-25F → 25-Nov, Dec-25F → 25-Dec로 변경
                        if (header === 'Nov-25F' || header === 'Nov') {
                          displayHeader = '25-Nov';
                        } else if (header === 'Dec-25F' || header === 'Dec') {
                          displayHeader = '25-Dec';
                        } else if (header.startsWith('24-Nov') || header === '24-Nov') {
                          displayHeader = '24-Nov';
                        } else if (header.startsWith('24-Dec') || header === '24-Dec') {
                          displayHeader = '24-Dec';
                        } else {
                          displayHeader = header.replace('-25A', '').replace('-25F', '(예상)');
                        }
                      }
                      
                      // 세트별 배경색 및 구분선 설정
                      // 첫 번째 세트: 24-Nov, Nov, Nov YoY
                      const isSet1Start = header === '24-Nov';
                      const isSet1 = header === 'Nov-25F' || header === 'Nov' || 
                                    header === '24-Nov' || header === 'Nov YoY';
                      const isSet1End = header === 'Nov YoY';
                      
                      // 두 번째 세트: 24-Dec, Dec, Dec YoY
                      const isSet2Start = header === '24-Dec';
                      const isSet2 = header === 'Dec-25F' || header === 'Dec' || 
                                    header === '24-Dec' || header === 'Dec YoY';
                      const isSet2End = header === 'Dec YoY';
                      
                      // 세트 구분을 위한 스타일 - 세트 사이에만 구분선 (회색으로 통일)
                      let setStyle = "";
                      const borderClass = "border-gray-500";
                      
                      if (isSet1) {
                        if (isSet1Start) {
                          setStyle += ` border-l-2 ${borderClass}`;
                        }
                        if (isSet1End) {
                          setStyle += ` border-r-2 ${borderClass}`;
                        }
                      } else if (isSet2) {
                        if (isSet2Start) {
                          setStyle += ` border-l-2 ${borderClass}`;
                        }
                        if (isSet2End) {
                          setStyle += ` border-r-2 ${borderClass}`;
                        }
                      }
                      
                      return (
                        <TableHead 
                          key={idx} 
                          className={cn(
                            header === '구분' ? "w-[250px] font-bold text-left" : 
                            header.includes('비고') ? "text-center font-bold w-[300px]" :
                            "text-center font-bold w-[110px]",
                            setStyle
                          )}
                        >
                          {displayHeader}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    let currentParent: string | null = null;
                    return workingCapitalData.map((row, idx) => {
                      const isParent = workingCapitalParents.includes(row.label);
                      
                      if (isParent) {
                        currentParent = row.label;
                      }
                      
                      if (!isParent && currentParent && !workingCapitalExpanded.has(currentParent)) {
                        return null;
                      }
                    
                      return (
                        <TableRow 
                          key={idx}
                          className={cn(
                            "hover:bg-gray-50",
                            isParent ? "cursor-pointer" : ""
                          )}
                          onClick={() => isParent && toggleWorkingCapitalCategory(row.label)}
                        >
                          <TableCell className={cn(
                            "font-medium",
                            isParent ? "font-bold text-base bg-gray-100 flex items-center gap-1" : "pl-8 text-sm"
                          )}>
                            {isParent && (
                              workingCapitalExpanded.has(row.label)
                                ? <ChevronDownIcon className="h-4 w-4 shrink-0" />
                                : <ChevronRightIcon className="h-4 w-4 shrink-0" />
                            )}
                            {row.label}
                          </TableCell>
                        {(() => {
                          const filteredValues = row.values.filter((_: any, colIdx: number) => {
                            if (showAllMonths) return true;
                            // After adding YoY: values array has 13 elements
                            // 0-9: Jan to Oct, 10: Nov, 11: YoY, 12: Dec
                            // We want to hide indices 0 to 9 (Jan to Oct), keep everything from Nov onwards
                            return colIdx > 9;
                          });
                          
                          const filteredHeaders = headers.filter((_: any, idx: number) => {
                            if (showAllMonths) return true;
                            return idx === 0 || idx >= 11;
                          });
                          
                          return filteredValues.map((value: string, colIdx: number) => {
                            // 헤더 인덱스는 colIdx + 1 (구분 컬럼 제외)
                            const headerIdx = colIdx + 1;
                            const currentHeader = filteredHeaders[headerIdx];
                            
                            // 세트별 배경색 설정 (헤더와 동일)
                            const isSet1Start = currentHeader === '24-Nov';
                            const isSet1 = currentHeader === 'Nov-25F' || currentHeader === 'Nov' || 
                                          currentHeader === '24-Nov' || currentHeader === 'Nov YoY';
                            const isSet1End = currentHeader === 'Nov YoY';
                            
                            const isSet2Start = currentHeader === '24-Dec';
                            const isSet2 = currentHeader === 'Dec-25F' || currentHeader === 'Dec' || 
                                          currentHeader === '24-Dec' || currentHeader === 'Dec YoY';
                            const isSet2End = currentHeader === 'Dec YoY';
                            
                            let setStyle = "";
                            const borderClass = "border-gray-500";

                            if (isSet1) {
                              if (isSet1Start) {
                                setStyle += ` border-l-2 ${borderClass}`;
                              }
                              if (isSet1End) {
                                setStyle += ` border-r-2 ${borderClass}`;
                              }
                            } else if (isSet2) {
                              if (isSet2Start) {
                                setStyle += ` border-l-2 ${borderClass}`;
                              }
                              if (isSet2End) {
                                setStyle += ` border-r-2 ${borderClass}`;
                              }
                            }
                            
                            const isNoteColumn = currentHeader === '비고';
                            let displayValue = formatValue(value, isNoteColumn);
                            let cellColorClass = isNoteColumn ? "" : getValueColor(value);
                            let highlightClass = "";

                            // Nov YoY, Dec YoY 컬럼 처리 (비고 컬럼 제외)
                            if (!isNoteColumn && (currentHeader === 'Nov YoY' || currentHeader === 'Dec YoY')) {
                                // CSV 값 그대로 표시하되, 천단위 콤마 적용
                                displayValue = value.replace(/\d+/g, (match) => {
                                  return Number(match).toLocaleString();
                                });
                            }
                            
                            return (
                              <TableCell 
                                key={colIdx}
                                className={cn(
                                  isNoteColumn ? "text-left font-bold w-[300px] whitespace-nowrap" : "text-right font-medium w-[110px]",
                                  cellColorClass,
                                  isParent ? "bg-gray-100 font-bold" : "",
                                  setStyle,
                                  highlightClass
                                )}
                              >
                                {displayValue}
                              </TableCell>
                            );
                          });
                        })()}
                      </TableRow>
                    );
                  })
                  })()}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STE 재무상태표 섹션 */}
      <STEBalanceSheetSection />
    </div>
  );
}

// STE 재무상태표 컴포넌트
function STEBalanceSheetSection() {
  const [csvData, setCsvData] = React.useState<any[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  // 기본: 자산총계만 펼침
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set(['자산총계']));
  const [showAllMonths, setShowAllMonths] = React.useState(false);

  const toggleRow = (label: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    const allCategories = ['자산총계', '부채총계', '자본총계', '무형자산'];
    const allOpen = allCategories.every(cat => expandedRows.has(cat));
    if (allOpen) {
      setExpandedRows(new Set());
    } else {
      setExpandedRows(new Set(allCategories));
    }
  };

  React.useEffect(() => {
    setLoading(true);
    fetch('/data/ste-balance-sheet.csv')
      .then(async (res) => {
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);

        let decodedText = '';
        if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
          decodedText = new TextDecoder('utf-16le').decode(bytes);
        } else if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
          decodedText = new TextDecoder('utf-8').decode(bytes);
        } else {
          decodedText = new TextDecoder('utf-8').decode(bytes);
        }

        return decodedText;
      })
      .then(text => {
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean)
          // CSV가 라인 전체를 "..." 로 감싼 형태로 저장되는 경우(Excel 저장/편집 등) 방어
          .map((line) => {
            const t = line.trim();
            if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) {
              // 양끝 큰따옴표 제거 + "" 이스케이프 복구
              return t.slice(1, -1).replace(/""/g, '"');
            }
            return t;
          });
        if (lines.length < 1) {
          setLoading(false);
          return;
        }
        
        const headerLine = lines[0];
        const parsedHeaders = parseCSVLine(headerLine);
        if (parsedHeaders.length > 0) {
          parsedHeaders[0] = (parsedHeaders[0] || '').replace(/^\uFEFF/, '');
        }
        setHeaders(parsedHeaders);
        
        const parsed: any[] = [];
        let currentParent: string | null = null;
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i];
          if (!line.trim()) continue;
          
          const values = parseCSVLine(line);
          if (values.length < 2) continue;
          
          const labelRaw = (values[0] || '').trim().replace(/^\uFEFF/, '');
          
          const isSubItem = labelRaw.startsWith("'-") || labelRaw.startsWith('-');
          const cleanLabel = labelRaw.replace(/^'-/, '').replace(/^-/, '').trim();
          
          const isMainCategory = !isSubItem;
          
          if (isMainCategory) {
            currentParent = cleanLabel;
          }
          
          const isCalculationResult = ['자산총계', '부채총계', '자본총계'].includes(cleanLabel);

          parsed.push({
            label: cleanLabel,
            values: values.slice(1),
            isSubItem,
            isMainCategory,
            isCalculationResult,
            parent: isSubItem ? currentParent : null
          });
        }
        
        const dataWithChildrenInfo = parsed.map(row => {
           const hasChildren = parsed.some(r => r.parent === row.label);
           return { ...row, hasChildren };
        });
        
        setCsvData(dataWithChildrenInfo);
        setLoading(false);
      })
      .catch(err => {
        console.error('STE Balance Sheet CSV 로드 오류:', err);
        setLoading(false);
      });
  }, []);

  const formatValue = (value: string) => {
    if (!value || value === '' || value === '-') return '-';
    
    if (value.includes('%')) {
      return value;
    }
    
    const cleanValue = value.replace(/,/g, '');
    const num = parseFloat(cleanValue);
    
    if (isNaN(num)) return value;
    if (num < 0) return `(${Math.abs(num).toLocaleString()})`;
    return num.toLocaleString();
  };

  const getValueColor = (value: string) => {
    if (!value || value === '' || value === '-') return '';
    
    const cleanValue = value.replace(/,/g, '');
    const num = parseFloat(cleanValue);
    
    if (!isNaN(num) && num < 0) {
      return "text-red-600";
    }
    return "";
  };

  if (loading) {
    return (
      <Card className="mt-8">
        <div className="text-center text-gray-500 p-8">데이터를 불러오는 중...</div>
      </Card>
    );
  }

  const foldMonthHeaders = new Set([
    'Jan-25',
    'Feb-25',
    'Mar-25',
    'Apr-25',
    'May-25',
    'Jun-25',
    'Jul-25',
    'Aug-25',
    'Sep-25',
    'Oct-25',
    'Nov-25',
  ]);
  const visibleHeaderIndices = headers
    .map((h, idx) => ({ h: (h || '').trim(), idx }))
    .filter(({ h, idx }) => {
      if (idx === 0) return true;
      if (showAllMonths) return true;
      return !foldMonthHeaders.has(h);
    })
    .map(({ idx }) => idx);

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">STE 재무상태표 (단위 : K £)</CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
          >
            {['자산총계', '부채총계', '자본총계', '무형자산'].every(cat => expandedRows.has(cat)) ? "접기" : "열기"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAllMonths(prev => !prev)}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
          >
            {showAllMonths ? "월 접기" : "월 펼치기"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-hidden">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-50/50">
                  {visibleHeaderIndices.map((headerIndex) => {
                    const header = headers[headerIndex];
                    const index = headerIndex;
                    const prevHeader = index > 0 ? headers[visibleHeaderIndices[index - 1]] : null;
                    const isAfterGubun = prevHeader === '구분';
                    const isAfterYeonbi = prevHeader === '전년대비';
                    
                    return (
                    <th 
                      key={index} 
                      className={`h-12 px-4 align-middle font-bold text-black [&:has([role=checkbox])]:pr-0 ${
                        index === 0
                          ? "w-[250px] font-bold text-left sticky left-0 z-20 bg-gray-50"
                          : header === '비고'
                          ? "text-center font-bold min-w-[300px]"
                          : "text-right font-bold min-w-[80px]"
                      } ${
                        isAfterGubun || isAfterYeonbi ? "border-l-2 border-gray-500" : ""
                      }`}
                    >
                      {header === '구분' ? '구분' : header}
                    </th>
                  )})}
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {csvData.map((row, rowIndex) => {
                  if (row.isSubItem && row.parent && !expandedRows.has(row.parent)) {
                    return null;
                  }

                  return (
                    <tr 
                      key={rowIndex} 
                      className={cn(
                        row.isMainCategory ? "bg-gray-100" :
                        row.isSubItem ? "bg-gray-50" : "",
                        "hover:bg-gray-50",
                        row.hasChildren && row.label !== '무형자산' ? "cursor-pointer" : ""
                      )}
                    >
                      <td
                        className={cn(
                          "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 sticky left-0 z-10 flex items-center h-full",
                          row.isMainCategory ? "font-bold text-base" : "font-bold",
                          row.isSubItem ? "pl-12 text-sm text-gray-600 font-bold" : "pl-2",
                          row.isCalculationResult ? "font-bold text-base" : "",
                          row.isMainCategory ? "bg-gray-100" : "bg-white",
                          row.hasChildren && row.label !== '무형자산' ? "cursor-pointer" : ""
                        )}
                        onClick={() => {
                          if (row.hasChildren && row.label !== '무형자산') toggleRow(row.label);
                        }}
                      >
                        {row.hasChildren && row.label !== '무형자산' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRow(row.label);
                            }}
                            className="w-4 flex justify-center mr-1 text-xs text-gray-500"
                            aria-label={`${row.label} ${expandedRows.has(row.label) ? "접기" : "펼치기"}`}
                          >
                            {expandedRows.has(row.label) ? (
                              <ChevronDownIcon className="h-4 w-4" />
                            ) : (
                              <ChevronRightIcon className="h-4 w-4" />
                            )}
                          </button>
                        )}
                        {(row.hasChildren && row.label === '무형자산') || (!row.hasChildren && !row.isSubItem) ? (
                          <span className="w-4 mr-1 inline-block" />
                        ) : null}
                        {row.label}
                      </td>
                      {visibleHeaderIndices
                        .filter((idx) => idx !== 0)
                        .map((headerIdx, colIndex) => {
                          const valIndex = headerIdx - 1;
                          const val = row.values?.[valIndex] ?? '';
                          const currentHeader = headers[headerIdx];
                          const isNoteColumn = currentHeader === '비고';
                          const filteredIndices = visibleHeaderIndices.filter((idx) => idx !== 0);
                          const prevHeaderIdx = colIndex > 0 ? filteredIndices[colIndex - 1] : null;
                          const prevHeader = prevHeaderIdx !== null ? headers[prevHeaderIdx] : null;
                          const isAfterGubun = prevHeader === '구분' || (colIndex === 0 && headers[visibleHeaderIndices[0]] === '구분');
                          const isAfterYeonbi = prevHeader === '전년대비';
                          
                          return (
                            <td
                              key={headerIdx}
                              className={cn(
                                "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 font-bold",
                                isNoteColumn ? "text-left" : "text-right",
                                !isNoteColumn && getValueColor(val),
                                (isAfterGubun || isAfterYeonbi) ? "border-l-2 border-gray-500" : ""
                              )}
                            >
                              {isNoteColumn ? val : formatValue(val)}
                            </td>
                          );
                        })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 현금흐름표 CSV 파싱 및 표시 컴포넌트
function CashFlowSection({ selectedMonth }: { selectedMonth: string }) {
  const [cashFlowData, setCashFlowData] = React.useState<any[]>([]);
  const [loanData, setLoanData] = React.useState<any[]>([]);
  const [factorsData, setFactorsData] = React.useState<any[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [loanHeaders, setLoanHeaders] = React.useState<string[]>([]);
  const [factorsHeaders, setFactorsHeaders] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expandedCategories, setExpandedCategories] = React.useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = React.useState(false);

  React.useEffect(() => {
    setLoading(true);
    // CSV 파일 읽기
    fetch('/data/cash-flow.csv')
      .then(res => res.text())
      .then(text => {
        const lines = text.split('\n').filter(line => line.trim());
        
        // 현금흐름표 섹션 파싱
        const cashFlowStart = lines.findIndex(line => line.includes('3. 현금흐름표'));
        const cashFlowEnd = lines.findIndex((line, idx) => idx > cashFlowStart && line.includes('3-2. STO 차입현황'));
        
        if (cashFlowStart >= 0) {
          // 헤더 파싱 (현금흐름표 섹션의 두 번째 줄, 인덱스: cashFlowStart + 1)
          const headerLine = lines[cashFlowStart + 1];
          const parsedHeaders = parseCSVLine(headerLine);
          const totalIndex = parsedHeaders.findIndex(h => h && h.trim() === 'Total');
          let dataHeaders = totalIndex > 0 
            ? parsedHeaders.slice(1, totalIndex + 1)
            : parsedHeaders.slice(1).filter(h => h && h.trim() !== '');
          
          // 24-Nov와 24-Dec, Dec YoY 제거 (CSV에 이미 없어야 하지만 혹시 모르니)
          dataHeaders = dataHeaders.filter(h => h && h.trim() !== '24-Nov' && h.trim() !== '24-Dec' && h.trim() !== 'Dec YoY');
          
          setHeaders(['구분', ...dataHeaders]);
          
          // 현금흐름표 데이터 파싱 (세 번째 줄부터, 인덱스: cashFlowStart + 2)
          const cashFlowEndLine = cashFlowEnd > 0 ? cashFlowEnd : lines.length;
          const parsed: any[] = [];
          let currentParent: any = null;
          
          for (let i = cashFlowStart + 2; i < cashFlowEndLine; i++) {
            const line = lines[i];
            if (!line.trim() || line.match(/^,{10,}/)) continue;
            
            const values = parseCSVLine(line);
            if (values.length < 2 || !values[0]) continue;
            
            const label = values[0].trim();
            
            // (1), (2)로 시작하는 메인 카테고리
            const isMainCategory = /^\([0-9]+\)/.test(label);
            
            // 하위 항목 확인
            const isSubItem = !isMainCategory && 
                             !['기초현금', '기말현금', '(1) 영업활동', '(2) 재무활동'].includes(label);
            
            const totalIndex = parsedHeaders.findIndex(h => h && h.trim() === 'Total');
            const dataCount = totalIndex > 0 ? totalIndex : parsedHeaders.length - 1;
            const monthValues = values.slice(1, 1 + dataCount);
            
            const cleanedValues = monthValues.map((val: string) => {
              // 괄호는 유지하고 $, 따옴표만 제거
              let cleaned = val.replace(/[$"]/g, '').trim();
              if (cleaned === '-' || !cleaned || cleaned === '' || cleaned === ' ') return '';
              return cleaned;
            });
            
            const cleanLabel = label.replace(/^\([0-9]+\)/, '').trim();
            const isMain = isMainCategory || ['기초현금', '기말현금'].includes(label);
            
            parsed.push({
              label: cleanLabel || label,
              values: cleanedValues,
              isMainCategory: isMain,
              isSubItem,
              parentCategory: isSubItem ? currentParent : null,
              categoryKey: isMain ? (cleanLabel || label) : null
            });
            
            if (isMainCategory) {
              currentParent = label;
            }
          }
          
          setCashFlowData(parsed);
        }
        
        // STO 차입현황 섹션 파싱
        const loanStart = lines.findIndex(line => line.includes('3-2. STO 차입현황'));
        const loanEnd = lines.findIndex((line, idx) => idx > loanStart && line.includes('3-3.'));
        
        if (loanStart >= 0) {
          const loanEndLine = loanEnd > 0 ? loanEnd : lines.length;
          const loanParsed: any[] = [];
          
          // 헤더 찾기
          for (let i = loanStart; i < loanEndLine; i++) {
            const line = lines[i];
            if (line.includes('기초금액') || line.includes('기말금액')) {
              const values = parseCSVLine(line);
              const cleanedHeaders = values.filter(h => h && h.trim() !== '').map(h => h.trim());
              if (cleanedHeaders.length > 2) {
                setLoanHeaders(cleanedHeaders);
              }
            }
            
            if (line.includes('본사 차입금')) {
              const values = parseCSVLine(line);
              const cleanedValues = values.filter(v => v && v.trim() !== '').map(v => {
                let cleaned = v.replace(/[$,"]/g, '').trim();
                if (cleaned === '-' || !cleaned || cleaned === '' || cleaned === ' ') return '';
                return cleaned;
              });
              
              if (cleanedValues.length > 0) {
                loanParsed.push({
                  label: cleanedValues[0],
                  values: cleanedValues.slice(1)
                });
              }
            }
          }
          
          setLoanData(loanParsed);
        }
        
        // 영업현금흐름 악화 요인 섹션 파싱
        const factorsStart = lines.findIndex(line => line.includes('3-3. 2025년 STO 영업현금흐름 악화 요인'));
        
        if (factorsStart >= 0) {
          // 헤더 줄 찾기 (구 분이 포함된 줄)
          let headerStartIdx = -1;
          let dataLineIdx = -1;
          
          for (let i = factorsStart; i < Math.min(factorsStart + 10, lines.length); i++) {
            const line = lines[i];
            if (line.includes('구 분') && headerStartIdx === -1) {
              headerStartIdx = i;
            }
            if (line.includes('금 액') && dataLineIdx === -1) {
              dataLineIdx = i;
              break;
            }
          }
          
          if (headerStartIdx >= 0 && dataLineIdx >= 0) {
            // 헤더 줄들을 합치기 (여러 줄에 걸쳐 있을 수 있음)
            // CSV에서 따옴표로 감싸진 값이 여러 줄에 걸쳐 있을 수 있음
            let headerText = '';
            for (let i = headerStartIdx; i < dataLineIdx; i++) {
              const line = lines[i];
              // 줄바꿈을 공백으로 대체
              headerText += line.replace(/\n/g, ' ') + ' ';
            }
            
            // CSV 파싱 (따옴표 안의 콤마를 보존)
            const headerValues = parseCSVLine(headerText.trim());
            
            // "구 분" 제외하고 헤더 추출
            const cleanedHeaders: string[] = [];
            let skipNext = false;
            for (let i = 0; i < headerValues.length; i++) {
              const val = headerValues[i] ? headerValues[i].trim() : '';
              if (val === '구 분' || val === '' || !val) {
                continue;
              }
              // 줄바꿈 제거 및 정리
              const cleanHeader = val.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
              if (cleanHeader) {
                cleanedHeaders.push(cleanHeader);
              }
            }
            
            // 데이터 줄 파싱
            const dataLine = lines[dataLineIdx];
            const dataValues = parseCSVLine(dataLine);
            
            // "금 액" 이후의 값들 추출
            const cleanedValues: string[] = [];
            let foundGeumaek = false;
            for (let i = 0; i < dataValues.length; i++) {
              const val = dataValues[i] ? dataValues[i].trim() : '';
              if (!foundGeumaek && val.includes('금 액')) {
                foundGeumaek = true;
                continue;
              }
              if (foundGeumaek) {
                // 값 정제 ($, 쉼표, 따옴표 제거)
                let cleaned = val.replace(/[$,"]/g, '').trim();
                if (cleaned === '-' || cleaned === '') {
                  cleanedValues.push('');
                } else {
                  cleanedValues.push(cleaned);
                }
              }
            }
            
            // 헤더와 값을 매핑
            const factorsParsed: any[] = [];
            const maxLength = Math.max(cleanedHeaders.length, cleanedValues.length);
            
            for (let i = 0; i < maxLength; i++) {
              const header = cleanedHeaders[i];
              const value = cleanedValues[i] || '';
              
              if (header) {
                factorsParsed.push({
                  label: header,
                  value: value
                });
              }
            }
            
            if (factorsParsed.length > 0) {
              setFactorsData(factorsParsed);
              setFactorsHeaders(['구 분', ...cleanedHeaders]);
            }
          }
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error('CSV 로드 오류:', err);
        setLoading(false);
      });
  }, []);

  const formatValue = (value: string) => {
    if (!value || value === '' || value === '-') return '-';
    
    // 퍼센트 값 처리
    if (value.includes('%')) {
      const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
      if (!isNaN(num)) {
        return `${num.toFixed(1)}%`;
      }
      return value;
    }
    
    // 특수 문자 처리 (△, +)
    if (value.includes('△') || value.startsWith('+')) {
      return value;
    }
    
    // 괄호로 감싸진 음수 처리 (예: ($2,223) 또는 ($662))
    if (value.includes('(') && value.includes(')')) {
      const cleaned = value.replace(/[($)]/g, '').replace(/,/g, '');
      const num = parseFloat(cleaned);
      if (!isNaN(num)) {
        return `(${num.toLocaleString()})`;
      }
    }
    
    // 일반 숫자 처리
    const cleanedValue = value.replace(/,/g, '').replace(/\$/g, '');
    const num = parseFloat(cleanedValue);
    if (isNaN(num)) return value;
    if (num < 0) return `(${Math.abs(num).toLocaleString()})`;
    return num.toLocaleString();
  };

  const getValueColor = (value: string) => {
    if (!value || value === '' || value === '-') return '';
    
    // 괄호로 감싸진 음수 체크
    if (value.includes('(') && value.includes(')')) {
      return "text-red-600";
    }
    
    // 일반 음수 체크
    const cleanedValue = value.replace(/,/g, '').replace(/\$/g, '').replace(/[()]/g, '');
    const num = parseFloat(cleanedValue);
    if (!isNaN(num) && num < 0 && !value.includes('△') && !value.includes('%')) {
      return "text-red-600";
    }
    return "";
  };

  const toggleCategory = (categoryKey: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpandedCategories(new Set());
      setAllExpanded(false);
    } else {
      const allCategories = cashFlowData
        .filter(row => row.isMainCategory && row.categoryKey)
        .map(row => row.categoryKey);
      setExpandedCategories(new Set(allCategories));
      setAllExpanded(true);
    }
  };

  // 필터링된 데이터
  const filteredData = React.useMemo(() => {
    const result: any[] = [];
    let currentCategory: string | null = null;
    
    for (const row of cashFlowData) {
      if (row.isMainCategory) {
        currentCategory = row.categoryKey;
        result.push(row);
      } else if (row.isSubItem) {
        if (currentCategory && expandedCategories.has(currentCategory)) {
          result.push(row);
        }
      } else {
        result.push(row);
      }
    }
    
    return result;
  }, [cashFlowData, expandedCategories]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">데이터를 불러오는 중...</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 현금흐름표 본문 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold">현금흐름표 (단위 : K $)</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
          >
            {allExpanded ? "접기" : "열기"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {headers.map((header, idx) => {
                    let displayHeader = header;
                    if (header !== '구분') {
                      // Nov-25F → 25-Nov, Dec-25F → 25-Dec로 변경
                      if (header === 'Nov-25F' || header === 'Nov') {
                        displayHeader = '25-Nov';
                      } else if (header === 'Dec-25F' || header === 'Dec') {
                        displayHeader = '25-Dec';
                      } else {
                        displayHeader = header.replace('-25A', '').replace('-25F', '(예상)');
                      }
                    }
                    
                    return (
                      <TableHead 
                        key={idx} 
                        className={cn(
                          idx === 0 ? "w-[250px] font-bold text-left" : "text-right font-bold min-w-[100px]",
                          header === 'Total' ? "font-bold bg-blue-50" : ""
                        )}
                      >
                        {displayHeader}
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((row, idx) => {
                  const isExpanded = row.categoryKey ? expandedCategories.has(row.categoryKey) : false;
                  
                  return (
                    <TableRow 
                      key={idx}
                      className={cn(
                        row.isMainCategory ? "bg-gray-100 cursor-pointer" : 
                        row.isSubItem ? "bg-gray-50" : "",
                        "hover:bg-gray-50"
                      )}
                      onClick={() => row.isMainCategory && row.categoryKey && toggleCategory(row.categoryKey)}
                    >
                      <TableCell className={cn(
                        row.isMainCategory ? "font-bold text-base" : "font-medium",
                        row.isSubItem ? "pl-8 text-sm" : "",
                        row.isMainCategory && "flex items-center gap-2"
                      )}>
                        {row.isMainCategory && row.categoryKey && (
                          <span className="text-xs">
                            {isExpanded ? '▼' : '▶'}
                          </span>
                        )}
                        {row.label}
                      </TableCell>
                      {row.values.map((value: string, colIdx: number) => (
                        <TableCell 
                          key={colIdx}
                          className={cn(
                            "text-right font-medium",
                            getValueColor(value),
                            headers[colIdx + 1] === 'Total' ? "bg-blue-50 font-bold" : ""
                          )}
                        >
                          {formatValue(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* STO 차입현황 섹션 */}
      {loanData.length > 0 && loanHeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">STO 차입현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {loanHeaders.map((header, idx) => (
                      <TableHead 
                        key={idx} 
                        className={cn(
                          idx === 0 ? "w-[200px] font-bold text-left" : "text-right font-bold min-w-[100px]"
                        )}
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loanData.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{row.label}</TableCell>
                      {row.values.map((value: string, colIdx: number) => (
                        <TableCell 
                          key={colIdx}
                          className={cn(
                            "text-right font-medium",
                            getValueColor(value)
                          )}
                        >
                          {formatValue(value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 영업현금흐름 악화 요인 섹션 */}
      {factorsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-bold">2025년 STO 영업현금흐름 악화 요인</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[150px] font-bold text-left">구 분</TableHead>
                    {factorsData.map((row, idx) => (
                      <TableHead 
                        key={idx} 
                        className="text-right font-bold min-w-[120px]"
                      >
                        {row.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell className="font-medium">금 액</TableCell>
                    {factorsData.map((row, idx) => (
                      <TableCell 
                        key={idx}
                        className={cn(
                          "text-right font-medium",
                          getValueColor(row.value)
                        )}
                      >
                        {formatValue(row.value)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const pnlData = [
  { label: "TAG가", m_prev: "45,104", m_prev_p: "148.4%", m_curr: "47,127", m_curr_p: "149.0%", m_diff: "+2,023", m_yoy: "104%", y_prev: "426,987", y_prev_p: "149.7%", y_curr: "404,688", y_curr_p: "149.2%", y_diff: "-22,299", y_yoy: "95%" },
  { label: "실판매출", m_prev: "33,428", m_prev_p: "110.0%", m_curr: "34,803", m_curr_p: "110.0%", m_diff: "+1,375", m_yoy: "104%", y_prev: "313,702", y_prev_p: "110.0%", y_curr: "298,305", y_curr_p: "110.0%", y_diff: "-15,397", y_yoy: "95%" },
  { label: "당시즌 생산원가", m_prev: "20.3%", m_prev_p: "", m_curr: "19.3%", m_curr_p: "", m_diff: "-1.0%", m_yoy: "95%", y_prev: "19.9%", y_prev_p: "", y_curr: "19.3%", y_curr_p: "", y_diff: "-0.6%", y_yoy: "95%" },
  { label: "매출이익", m_prev: "14,985", m_prev_p: "49.3%", m_curr: "15,669", m_curr_p: "49.5%", m_diff: "+684", m_yoy: "105%", y_prev: "135,713", y_prev_p: "47.6%", y_curr: "130,388", y_curr_p: "48.1%", y_diff: "-5,325", y_yoy: "96%" },
  { label: "직접비", m_prev: "5,586", m_prev_p: "18.4%", m_curr: "5,705", m_curr_p: "18.0%", m_diff: "+118", m_yoy: "102%", y_prev: "54,379", y_prev_p: "19.1%", y_curr: "54,684", y_curr_p: "20.2%", y_diff: "+305", y_yoy: "101%" },
  { label: "직접이익", m_prev: "9,399", m_prev_p: "30.9%", m_curr: "9,964", m_curr_p: "31.5%", m_diff: "+565", m_yoy: "106%", y_prev: "81,334", y_prev_p: "28.5%", y_curr: "75,704", y_curr_p: "27.9%", y_diff: "-5,630", y_yoy: "93%" },
  { label: "영업비", m_prev: "4,483", m_prev_p: "14.8%", m_curr: "4,659", m_curr_p: "14.7%", m_diff: "+176", m_yoy: "104%", y_prev: "39,996", y_prev_p: "14.0%", y_curr: "41,759", y_curr_p: "15.4%", y_diff: "+1,762", y_yoy: "104%" },
  { label: "영업이익", m_prev: "4,916", m_prev_p: "16.2%", m_curr: "5,305", m_curr_p: "16.8%", m_diff: "+389", m_yoy: "108%", y_prev: "41,337", y_prev_p: "14.5%", y_curr: "33,945", y_curr_p: "12.5%", y_diff: "-7,392", y_yoy: "82%" },
];

// CSV 파일에서 대시보드 데이터를 파싱하는 함수
function parseDashboardCSV(csvText: string): Record<string, Record<string, string>> {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return {};
  
  // 헤더 파싱
  const headers = parseCSVLine(lines[0]);
  const monthIndices: Record<string, number> = {};
  headers.forEach((header, idx) => {
    if (header && header !== '데이터키') {
      monthIndices[header] = idx;
    }
  });
  
  // 데이터 파싱
  const data: Record<string, Record<string, string>> = {};
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || !values[0]) continue;
    
    const dataKey = values[0];
    data[dataKey] = {};
    
    // 각 월별 데이터 저장
    Object.keys(monthIndices).forEach(month => {
      const idx = monthIndices[month];
      if (values[idx] !== undefined) {
        // 따옴표 제거 및 trim
        let value = values[idx].trim();
        value = value.replace(/^["']|["']$/g, '');
        data[dataKey][month] = value;
      }
    });
  }
  
  return data;
}

// CSV 파일에서 대시보드 요약 데이터를 파싱하는 함수
function parseSummaryCSV(csvText: string): Record<string, Record<string, string>> {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return {};
  
  // 헤더 파싱
  const headers = parseCSVLine(lines[0]);
  const monthIndices: Record<string, number> = {};
  headers.forEach((header, idx) => {
    if (header && header !== '데이터키') {
      monthIndices[header] = idx;
    }
  });
  
  // 데이터 파싱
  const data: Record<string, Record<string, string>> = {};
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || !values[0]) continue;
    
    const dataKey = values[0];
    data[dataKey] = {};
    
    // 각 월별 데이터 저장
    Object.keys(monthIndices).forEach(month => {
      const idx = monthIndices[month];
      if (values[idx] !== undefined) {
        data[dataKey][month] = values[idx].trim();
      }
    });
  }
  
  return data;
}

// Force refresh: 2026-01 data check
export default function DashboardPage() {
  const [expandAllDetails, setExpandAllDetails] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("대시보드");
  
  // 각 탭별로 독립적인 조회 기준 월 관리
  const [tabSelectedMonths, setTabSelectedMonths] = React.useState<Record<string, string>>({
    "대시보드": "2026-01",
    "손익계산서": "2026-01",
    "재무상태표": "2026-01",
    "현금흐름표": "2026-01",
    "영업비 분석": "2026-01",
  });
  
  // CSV 데이터 로딩 상태
  const [dashboardData, setDashboardData] = React.useState<Record<string, Record<string, string>>>({});
  const [summaryData, setSummaryData] = React.useState<Record<string, Record<string, string>>>({});
  const [directProfitPopupData, setDirectProfitPopupData] = React.useState<DirectProfitPopupData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = React.useState(true);
  
  // CSV 파일 로딩
  React.useEffect(() => {
    if (activeTab !== "대시보드") return;
    
    setLoadingDashboard(true);
    const timestamp = new Date().getTime();
    Promise.all([
      fetch(`/data/dashboard-data.csv?t=${timestamp}`).then(res => res.text()),
      fetch(`/data/dashboard-summary.csv?t=${timestamp}`).then(res => res.text()),
      fetch(`/data/direct-profit-popup.csv?t=${timestamp}`).then(async (res) => {
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
          return new TextDecoder('utf-16le').decode(bytes);
        }
        if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
          return new TextDecoder('utf-8').decode(bytes);
        }
        return new TextDecoder('utf-8').decode(bytes);
      })
    ])
    .then(([dashboardCsv, summaryCsv, directProfitPopupCsv]) => {
      setDashboardData(parseDashboardCSV(dashboardCsv));
      setSummaryData(parseSummaryCSV(summaryCsv));
      setDirectProfitPopupData(parseDirectProfitPopupCSV(directProfitPopupCsv));
      setLoadingDashboard(false);
    })
    .catch(err => {
      console.error('Error loading CSV files:', err);
      setLoadingDashboard(false);
    });
  }, [activeTab]);
  
  // 현재 활성 탭의 선택된 월 (useMemo보다 먼저 선언)
  const currentSelectedMonth = tabSelectedMonths[activeTab] || "2025-12";
  
  // CSV 데이터에서 선택된 월의 값을 가져오는 헬퍼 함수
  const getDataValue = (dataKey: string, month: string, defaultValue: string = ''): string => {
    // CSV 헤더 형식(25-Jan, 25-Feb, ..., 25-Nov, 25-Dec, 26-Jan)과 코드 형식(2025-01, 2025-02, ..., 2026-01) 매핑
    const monthMapping: Record<string, string> = {
      '2025-01': '25-Jan',
      '2025-02': '25-Feb',
      '2025-03': '25-Mar',
      '2025-04': '25-Apr',
      '2025-05': '25-May',
      '2025-06': '25-Jun',
      '2025-07': '25-Jul',
      '2025-08': '25-Aug',
      '2025-09': '25-Sep',
      '2025-10': '25-Oct',
      '2025-11': '25-Nov',
      '2025-12': '25-Dec',
      '2026-01': '26-Jan'
    };
    
    const csvMonthKey = monthMapping[month] || month;
    
    if (!dashboardData[dataKey] || !dashboardData[dataKey][csvMonthKey]) {
      return defaultValue;
    }
    // CSV 값에서 따옴표와 콤마 처리 (예: "1,936" -> "1936" 또는 "1,936" 유지)
    let value = dashboardData[dataKey][csvMonthKey];
    // 따옴표 제거는 이미 trim()에서 처리되지만, 명시적으로 처리
    return value.replace(/^["']|["']$/g, '');
  };
  
  const getSummaryValue = (dataKey: string, month: string, defaultValue: string = ''): string => {
    // CSV 헤더 형식(25-Jan, 25-Feb, ..., 25-Nov, 25-Dec, 26-Jan)과 코드 형식(2025-01, 2025-02, ..., 2026-01) 매핑
    const monthMapping: Record<string, string> = {
      '2025-01': '25-Jan',
      '2025-02': '25-Feb',
      '2025-03': '25-Mar',
      '2025-04': '25-Apr',
      '2025-05': '25-May',
      '2025-06': '25-Jun',
      '2025-07': '25-Jul',
      '2025-08': '25-Aug',
      '2025-09': '25-Sep',
      '2025-10': '25-Oct',
      '2025-11': '25-Nov',
      '2025-12': '25-Dec',
      '2026-01': '26-Jan'
    };
    
    const csvMonthKey = monthMapping[month] || month;
    
    if (!summaryData[dataKey] || !summaryData[dataKey][csvMonthKey]) {
      return defaultValue;
    }
    return summaryData[dataKey][csvMonthKey];
  };
  
  // 선택된 월에 맞춰 카드 데이터 생성
  const cardData = React.useMemo(() => {
    const month = currentSelectedMonth;
    if (loadingDashboard || Object.keys(dashboardData).length === 0) {
      return null;
    }
    
    const formatNumber = (val: string): string => {
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return num.toLocaleString('en-US');
    };
    
    const formatPercent = (val: string): string => {
      if (!val) return val;
      // 퍼센트 기호가 포함된 경우
      if (val.includes('%')) {
        const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
        if (isNaN(num)) return val;
        // 소수점이 0이면 정수로, 아니면 소수점 첫째 자리로 표시
        if (num % 1 === 0) {
          return `${num}%`;
        }
        return `${num.toFixed(1)}%`;
      }
      // 퍼센트가 없는 경우 그대로 반환
      return val;
    };
    
    return {
      // 실판매출 카드
      salesCard: {
        value: `$${formatNumber(getDataValue('카드_실판매출_값', month, '31755'))}K`,
        yoy: getDataValue('카드_실판매출_YOY', month, '104%'),
        salesShare: `매출비중 ${formatPercent(getDataValue('카드_실판매출_매출비중', month, '100%'))}`,
        channelDetails: [
          {
            name: "US홀세일",
            value: formatNumber(getDataValue('카드_실판매출_채널_US홀세일_값', month, '8000')),
            yoy: getDataValue('카드_실판매출_채널_US홀세일_YOY', month, '105%'),
            percent: formatPercent(getDataValue('카드_실판매출_채널_US홀세일_비중', month, '25.2%'))
          },
          {
            name: "US EC",
            value: formatNumber(getDataValue('카드_실판매출_채널_USEC_값', month, '12000')),
            yoy: getDataValue('카드_실판매출_채널_USEC_YOY', month, '110%'),
            percent: formatPercent(getDataValue('카드_실판매출_채널_USEC_비중', month, '37.8%'))
          },
          {
            name: "EU EC",
            value: formatNumber(getDataValue('카드_실판매출_채널_EUEC_값', month, '9500')),
            yoy: getDataValue('카드_실판매출_채널_EUEC_YOY', month, '98%'),
            percent: formatPercent(getDataValue('카드_실판매출_채널_EUEC_비중', month, '29.9%'))
          },
          {
            name: "라이선스",
            value: formatNumber(getDataValue('카드_실판매출_채널_라이선스_값', month, '2255')),
            yoy: getDataValue('카드_실판매출_채널_라이선스_YOY', month, '95%'),
            percent: formatPercent(getDataValue('카드_실판매출_채널_라이선스_비중', month, '7.1%'))
          }
        ],
        itemDetails: [
          {
            name: "25FW",
            value: formatNumber(getDataValue('카드_실판매출_아이템_25FW_값', month, '12500')),
            yoy: getDataValue('카드_실판매출_아이템_25FW_YOY', month, '108%'),
            percent: formatPercent(getDataValue('카드_실판매출_아이템_25FW_비중', month, '39.4%'))
          },
          {
            name: "25SS",
            value: formatNumber(getDataValue('카드_실판매출_아이템_25SS_값', month, '3500')),
            yoy: getDataValue('카드_실판매출_아이템_25SS_YOY', month, '112%'),
            percent: formatPercent(getDataValue('카드_실판매출_아이템_25SS_비중', month, '11.0%'))
          },
          {
            name: "FW과시즌",
            value: formatNumber(getDataValue('카드_실판매출_아이템_FW과시즌_값', month, '2800')),
            yoy: getDataValue('카드_실판매출_아이템_FW과시즌_YOY', month, '85%'),
            percent: formatPercent(getDataValue('카드_실판매출_아이템_FW과시즌_비중', month, '8.8%'))
          },
          {
            name: "SS과시즌",
            value: formatNumber(getDataValue('카드_실판매출_아이템_SS과시즌_값', month, '1200')),
            yoy: getDataValue('카드_실판매출_아이템_SS과시즌_YOY', month, '78%'),
            percent: formatPercent(getDataValue('카드_실판매출_아이템_SS과시즌_비중', month, '3.8%'))
          },
          {
            name: "CORE",
            value: formatNumber(getDataValue('카드_실판매출_아이템_CORE_값', month, '11755')),
            yoy: getDataValue('카드_실판매출_아이템_CORE_YOY', month, '118%'),
            percent: formatPercent(getDataValue('카드_실판매출_아이템_CORE_비중', month, '37.0%'))
          }
        ]
      },
      // 직접이익 카드 (추가 구현 필요)
      // 직접이익 카드
      profitCard: {
        value: `$${formatNumber(getDataValue('카드_직접이익_값', month, '5305'))}K`,
        yoy: getDataValue('카드_직접이익_YOY', month, '108%'),
        profitMargin: `이익률 ${formatPercent(getDataValue('카드_직접이익_이익률', month, '16.8%'))}`,
        channelProfitDetails: [
          {
            name: "US홀세일",
            value: formatNumber(getDataValue('카드_직접이익_채널_US홀세일_값', month, '1200')),
            yoy: getDataValue('카드_직접이익_채널_US홀세일_YOY', month, '115%'),
            margin: formatPercent(getDataValue('카드_직접이익_채널_US홀세일_이익율', month, '28.5%'))
          },
          {
            name: "US EC",
            value: formatNumber(getDataValue('카드_직접이익_채널_USEC_값', month, '2800')),
            yoy: getDataValue('카드_직접이익_채널_USEC_YOY', month, '125%'),
            margin: formatPercent(getDataValue('카드_직접이익_채널_USEC_이익율', month, '32.1%'))
          },
          {
            name: "EU EC",
            value: formatNumber(getDataValue('카드_직접이익_채널_EUEC_값', month, '1100')),
            yoy: getDataValue('카드_직접이익_채널_EUEC_YOY', month, '98%'),
            margin: formatPercent(getDataValue('카드_직접이익_채널_EUEC_이익율', month, '24.8%'))
          },
          {
            name: "라이선스",
            value: formatNumber(getDataValue('카드_직접이익_채널_라이선스_값', month, '205')),
            yoy: getDataValue('카드_직접이익_채널_라이선스_YOY', month, '110%'),
            margin: formatPercent(getDataValue('카드_직접이익_채널_라이선스_이익율', month, '18.2%'))
          }
        ],
        directProfitYtdDetails: [
          {
            name: "US홀세일",
            value: getDataValue('카드_직접이익_직접이익YTD_US홀세일_값', month, '533'),
            percent: formatPercent(getDataValue('카드_직접이익_직접이익YTD_US홀세일_비중', month, '36.4%')),
            margin: formatPercent(getDataValue('카드_직접이익_직접이익YTD_US홀세일_이익율', month, '30.0%')),
            change: (() => {
              const val = getDataValue('카드_직접이익_직접이익YTD_US홀세일_변동', month, '517').replace(/△/g, '');
              return val.startsWith('-') ? `-${val.substring(1)}` : `+${val}`;
            })()
          },
          {
            name: "US EC",
            value: getDataValue('카드_직접이익_직접이익YTD_USEC_값', month, '3220'),
            percent: formatPercent(getDataValue('카드_직접이익_직접이익YTD_USEC_비중', month, '24.1%')),
            margin: formatPercent(getDataValue('카드_직접이익_직접이익YTD_USEC_이익율', month, '7.0%')),
            change: (() => {
              const val = getDataValue('카드_직접이익_직접이익YTD_USEC_변동', month, '251').replace(/△/g, '');
              return val.startsWith('-') ? `-${val.substring(1)}` : `+${val}`;
            })()
          },
          {
            name: "EU EC",
            value: getDataValue('카드_직접이익_직접이익YTD_EUEC_값', month, '81'),
            percent: formatPercent(getDataValue('카드_직접이익_직접이익YTD_EUEC_비중', month, '11.6%')),
            margin: formatPercent(getDataValue('카드_직접이익_직접이익YTD_EUEC_이익율', month, '25.0%')),
            change: (() => {
              const val = getDataValue('카드_직접이익_직접이익YTD_EUEC_변동', month, '258').replace(/△/g, '');
              return val.startsWith('-') ? `-${val.substring(1)}` : `+${val}`;
            })()
          },
          {
            name: "라이선스",
            value: getDataValue('카드_직접이익_직접이익YTD_라이선스_값', month, '668'),
            percent: formatPercent(getDataValue('카드_직접이익_직접이익YTD_라이선스_비중', month, '100%')),
            margin: formatPercent(getDataValue('카드_직접이익_직접이익YTD_라이선스_이익율', month, '100.0%')),
            change: (() => {
              const val = getDataValue('카드_직접이익_직접이익YTD_라이선스_변동', month, '134').replace(/△/g, '');
              return val.startsWith('-') ? `-${val.substring(1)}` : `+${val}`;
            })()
          }
        ]
      },
      // 영업비 카드
      expenseCard: {
        value: `$${formatNumber(getDataValue('카드_영업비_값', month, '4659'))}K`,
        yoy: getDataValue('카드_영업비_YOY', month, '104%'),
        operatingExpenseRatio: `영업비율 ${formatPercent(getDataValue('카드_영업비_영업비율', month, '15.0%'))}`,
        expenseBreakdown: [
          {
            name: "인건비",
            value: formatNumber(getDataValue('카드_영업비_인건비_값', month, '1843')),
            yoy: getDataValue('카드_영업비_인건비_YOY', month, '103%'),
            subItems: [
              {
                name: "급여(정규/계약)",
                value: formatNumber(getDataValue('카드_영업비_인건비_급여_값', month, '1450')),
                yoy: getDataValue('카드_영업비_인건비_급여_YOY', month, '105%')
              },
              {
                name: "보험,복지비등",
                value: formatNumber(getDataValue('카드_영업비_인건비_보험복지_값', month, '280')),
                yoy: getDataValue('카드_영업비_인건비_보험복지_YOY', month, '98%')
              }
            ]
          },
          {
            name: "광고선전비",
            value: formatNumber(getDataValue('카드_영업비_광고선전비_값', month, '898')),
            yoy: getDataValue('카드_영업비_광고선전비_YOY', month, '76%')
          },
          {
            name: "지급수수료",
            value: formatNumber(getDataValue('카드_영업비_지급수수료_값', month, '213')),
            yoy: getDataValue('카드_영업비_지급수수료_YOY', month, '114%')
          },
          {
            name: "식대/출장비",
            value: formatNumber(getDataValue('카드_영업비_식대출장비_값', month, '145')),
            yoy: getDataValue('카드_영업비_식대출장비_YOY', month, '92%')
          },
          {
            name: "임차료",
            value: formatNumber(getDataValue('카드_영업비_임차료_값', month, '280')),
            yoy: getDataValue('카드_영업비_임차료_YOY', month, '217%')
          },
          {
            name: "샘플비/개발비",
            value: formatNumber(getDataValue('카드_영업비_샘플비개발비_값', month, '165')),
            yoy: getDataValue('카드_영업비_샘플비개발비_YOY', month, '292%')
          },
          {
            name: "감가상각비",
            value: formatNumber(getDataValue('카드_영업비_감가상각비_값', month, '145')),
            yoy: getDataValue('카드_영업비_감가상각비_YOY', month, '168%')
          },
          {
            name: "기타비용",
            value: formatNumber(getDataValue('카드_영업비_기타비용_값', month, '134')),
            yoy: getDataValue('카드_영업비_기타비용_YOY', month, '85%')
          }
        ]
      },
      // 할인율 카드
      discountCard: {
        value: formatPercent(getDataValue('카드_할인율_값', month, '4.7%')),
        yoy: getDataValue('카드_할인율_YOY', month, '-0.4%p'),
        channelDetails: [
          {
            name: "US홀세일",
            value: formatPercent(getDataValue('카드_할인율_채널_US홀세일_값', month, '3.5%')),
            yoy: getDataValue('카드_할인율_채널_US홀세일_YOY', month, '(2.0%)'),
            percent: ""
          },
          {
            name: "US EC",
            value: formatPercent(getDataValue('카드_할인율_채널_USEC_값', month, '5.2%')),
            yoy: getDataValue('카드_할인율_채널_USEC_YOY', month, '(1.7%)'),
            percent: ""
          },
          {
            name: "EU EC",
            value: formatPercent(getDataValue('카드_할인율_채널_EUEC_값', month, '4.8%')),
            yoy: getDataValue('카드_할인율_채널_EUEC_YOY', month, '(3.2%)'),
            percent: ""
          }
        ],
        itemDetails: [
          {
            name: "25FW",
            value: getDataValue('카드_할인율_아이템_25FW_값', month, '4.8%'),
            yoy: getDataValue('카드_할인율_아이템_25FW_YOY', month, '(4.5%)'),
            percent: ""
          },
          {
            name: "25SS",
            value: getDataValue('카드_할인율_아이템_25SS_값', month, '5.2%'),
            yoy: getDataValue('카드_할인율_아이템_25SS_YOY', month, '(3.1%)'),
            percent: ""
          },
          {
            name: "FW과시즌",
            value: getDataValue('카드_할인율_아이템_FW과시즌_값', month, '8.5%'),
            yoy: getDataValue('카드_할인율_아이템_FW과시즌_YOY', month, '(12.2%)'),
            percent: ""
          },
          {
            name: "SS과시즌",
            value: getDataValue('카드_할인율_아이템_SS과시즌_값', month, '7.3%'),
            yoy: getDataValue('카드_할인율_아이템_SS과시즌_YOY', month, '(9.8%)'),
            percent: ""
          },
          {
            name: "CORE",
            value: getDataValue('카드_할인율_아이템_CORE_값', month, '3.2%'),
            yoy: getDataValue('카드_할인율_아이템_CORE_YOY', month, '(1.5%)'),
            percent: ""
          }
        ]
      },
      // 기타 메트릭 카드
      metricCards: {
        salesRate: {
          value: getDataValue('카드_당시즌판매율_값', month, '16.6%'),
          subValue: `전년 ${getDataValue('카드_당시즌판매율_전년비교', month, '21.1%')}`,
          subValueColor: "text-red-500" as const,
          description: `YoY ${getDataValue('카드_당시즌판매율_YOY', month, '-4.5%p')}`,
          itemDetails: [
            { 
              name: "Track Jacket", 
              value: getDataValue('카드_당시즌판매율_아이템_트랙자켓_값', month, '$8,404K'), 
              share: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_트랙자켓_비중', month, '42.1%')),
              rate: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_트랙자켓_비율', month, '4.0%')),
              prevRate: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_트랙자켓_전년', month, '0.0%')) 
            },
            { 
              name: "Track Pant", 
              value: getDataValue('카드_당시즌판매율_아이템_트랙팬츠_값', month, '$6,407K'), 
              share: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_트랙팬츠_비중', month, '32.1%')),
              rate: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_트랙팬츠_비율', month, '4.4%')),
              prevRate: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_트랙팬츠_전년', month, '0.0%')) 
            },
            { 
              name: "Total", 
              value: getDataValue('카드_당시즌판매율_아이템_전체발주_값', month, '$14,811K'), 
              share: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_전체발주_비중', month, '76.2%')),
              rate: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_전체발주_비율', month, '4.1%')),
              prevRate: formatPercentGlobal(getDataValue('카드_당시즌판매율_아이템_전체발주_전년', month, '0.0%'))
            }
          ]
        },
        mu: {
          value: getDataValue('카드_당시즌MU_값', month, '5.22'),
          subValue: `전년대비 ${getDataValue('카드_당시즌MU_전년비교', month, '5.0')}`,
          subValueColor: "text-red-500" as const,
          description: `YoY ${getDataValue('카드_당시즌MU_YOY', month, '-0.26')}`,
          topStoresDetails: [
            { 
              name: "Track Jacket", 
              value: getDataValue('카드_당시즌MU_아이템_TrackJacket_값', month, '5.12'), 
              yoy: `(전년${getDataValue('카드_당시즌MU_아이템_TrackJacket_전년', month, '5.21')})` 
            },
            { 
              name: "Track Pant", 
              value: getDataValue('카드_당시즌MU_아이템_TrackPant_값', month, '5.39'), 
              yoy: `(전년${getDataValue('카드_당시즌MU_아이템_TrackPant_전년', month, '6.03')})` 
            },
            { 
              name: "Hoodie", 
              value: getDataValue('카드_당시즌MU_아이템_Knitwear_값', month, '4.80'), 
              yoy: `(전년${getDataValue('카드_당시즌MU_아이템_Knitwear_전년', month, '5.19')})` 
            },
            { 
              name: "T-Shirt", 
              value: getDataValue('카드_당시즌MU_아이템_T-Shirt_값', month, '5.53'), 
              yoy: `(전년${getDataValue('카드_당시즌MU_아이템_T-Shirt_전년', month, '5.72')})` 
            },
            { 
              name: "Short", 
              value: getDataValue('카드_당시즌MU_아이템_Short_값', month, '5.34'), 
              yoy: `(전년${getDataValue('카드_당시즌MU_아이템_Short_전년', month, '5.36')})` 
            }
          ]
        },
        inventory: {
          value: `$${getDataValue('카드_기말재고_값', month, '38,065')}K`,
          subValue: `전년 $${getDataValue('카드_기말재고_전년비교', month, '18,099')}K`,
          subValueColor: "text-green-500" as const,
          description: `YoY ${getDataValue('카드_기말재고_YOY', month, '97.0%')}`,
          topStoresDetails: [
            { 
              name: "25FW", 
              value: `${getDataValue('카드_기말재고_아이템_FW당시즌_값', month, '74,484')}`, 
              yoy: `(전년${getDataValue('카드_기말재고_아이템_FW당시즌_전년', month, '111%')})` 
            },
            { 
              name: "25SS", 
              value: `${getDataValue('카드_기말재고_아이템_SS당시즌_값', month, '34,423')}`, 
              yoy: `(전년${getDataValue('카드_기말재고_아이템_SS당시즌_전년', month, '91%')})` 
            },
            { 
              name: "FW과시즌", 
              value: `${getDataValue('카드_기말재고_아이템_FW과시즌_값', month, '20,548')}`, 
              yoy: `(전년${getDataValue('카드_기말재고_아이템_FW과시즌_전년', month, '43%')})` 
            },
            { 
              name: "SS과시즌", 
              value: `${getDataValue('카드_기말재고_아이템_SS과시즌_값', month, '109,632')}`, 
              yoy: `(전년${getDataValue('카드_기말재고_아이템_SS과시즌_전년', month, '106%')})` 
            },
            { 
              name: "CORE", 
              value: `${getDataValue('카드_기말재고_아이템_CORE_값', month, '62,460')}`, 
              yoy: `(전년${getDataValue('카드_기말재고_아이템_CORE_전년', month, '120%')})` 
            }
          ]
        },
        headcount: {
          value: `${getDataValue('카드_인원수_값', month, '27')}명`,
          subValue: `전년 ${getDataValue('카드_인원수_전년비교', month, '140')}명`,
          subValueColor: "text-green-500" as const,
          description: `YoY ${getDataValue('카드_인원수_YOY', month, '-4')}명`,
          statsDetails: [
            {
              name: "인당 인건비",
              value: `${getDataValue('카드_인원수_인당인건비_값', month, '13.6')}`,
              yoy: getDataValue('카드_인원수_인당인건비_YOY', month, '106%')
            },
            {
              name: "인당 매출액",
              value: `${getDataValue('카드_인원수_인당매출액_값', month, '256')}`,
              yoy: getDataValue('카드_인원수_인당매출액_YOY', month, '107%')
            },
            {
              name: "인당 영업비",
              value: `${getDataValue('카드_인원수_인당영업비_값', month, '28')}`,
              yoy: getDataValue('카드_인원수_인당영업비_YOY', month, '108%')
            }
          ]
        }
      }
    };
  }, [dashboardData, currentSelectedMonth, loadingDashboard]);
  
  // 손익요약 데이터 생성
  const pnlDataFromCSV = React.useMemo(() => {
    const month = currentSelectedMonth;
    if (loadingDashboard || Object.keys(summaryData).length === 0) {
      return null;
    }
    
    const formatNumber = (val: string): string => {
      if (!val || val === '' || val === '-') return '';
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return num.toLocaleString('en-US');
    };
    
    const formatDiff = (val: string): string => {
      if (!val || val === '') return '';
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return num >= 0 ? `+${num.toLocaleString('en-US')}` : num.toLocaleString('en-US');
    };
    
    const rows = [
      {
        label: "TAG가",
        m_prev: formatNumber(getSummaryValue('손익요약_TAG가_당월실적_전년', month, '45104')),
        m_prev_p: getSummaryValue('손익요약_TAG가_당월실적_전년비율', month, '-'),
        m_curr: formatNumber(getSummaryValue('손익요약_TAG가_당월실적_당년', month, '47127')),
        m_curr_p: getSummaryValue('손익요약_TAG가_당월실적_당년비율', month, '-'),
        m_diff: formatDiff(getSummaryValue('손익요약_TAG가_당월실적_전년비', month, '2023')),
        m_yoy: getSummaryValue('손익요약_TAG가_당월실적_YOY', month, '104%'),
        y_prev: formatNumber(getSummaryValue('손익요약_TAG가_연간누적_전년', month, '426987')),
        y_prev_p: getSummaryValue('손익요약_TAG가_연간누적_전년비율', month, '-'),
        y_curr: formatNumber(getSummaryValue('손익요약_TAG가_연간누적_당년', month, '404688')),
        y_curr_p: getSummaryValue('손익요약_TAG가_연간누적_당년비율', month, '-'),
        y_diff: formatDiff(getSummaryValue('손익요약_TAG가_연간누적_전년비', month, '-22299')),
        y_yoy: getSummaryValue('손익요약_TAG가_연간누적_YOY', month, '95%')
      },
      {
        label: "실판매출",
        m_prev: formatNumber(getSummaryValue('손익요약_실판(v+)_당월실적_전년', month, '33428')),
        m_prev_p: getSummaryValue('손익요약_실판(v+)_당월실적_전년비율', month, '110.0%'),
        m_curr: formatNumber(getSummaryValue('손익요약_실판(v+)_당월실적_당년', month, '34803')),
        m_curr_p: getSummaryValue('손익요약_실판(v+)_당월실적_당년비율', month, '110.0%'),
        m_diff: formatDiff(getSummaryValue('손익요약_실판(v+)_당월실적_전년비', month, '1375')),
        m_yoy: getSummaryValue('손익요약_실판(v+)_당월실적_YOY', month, '104%'),
        y_prev: formatNumber(getSummaryValue('손익요약_실판(v+)_연간누적_전년', month, '313702')),
        y_prev_p: getSummaryValue('손익요약_실판(v+)_연간누적_전년비율', month, '110.0%'),
        y_curr: formatNumber(getSummaryValue('손익요약_실판(v+)_연간누적_당년', month, '298305')),
        y_curr_p: getSummaryValue('손익요약_실판(v+)_연간누적_당년비율', month, '110.0%'),
        y_diff: formatDiff(getSummaryValue('손익요약_실판(v+)_연간누적_전년비', month, '-15397')),
        y_yoy: getSummaryValue('손익요약_실판(v+)_연간누적_YOY', month, '95%')
      },
      {
        label: "생산원가",
        m_prev: getSummaryValue('손익요약_생산원가_당월실적_전년', month, '20.3%'),
        m_prev_p: '',
        m_curr: getSummaryValue('손익요약_생산원가_당월실적_당년', month, '19.3%'),
        m_curr_p: '',
        m_diff: getSummaryValue('손익요약_생산원가_당월실적_전년비', month, '-1.0%'),
        m_yoy: getSummaryValue('손익요약_생산원가_당월실적_YOY', month, '95%'),
        y_prev: getSummaryValue('손익요약_생산원가_연간누적_전년', month, '19.9%'),
        y_prev_p: '',
        y_curr: getSummaryValue('손익요약_생산원가_연간누적_당년', month, '19.3%'),
        y_curr_p: '',
        y_diff: getSummaryValue('손익요약_생산원가_연간누적_전년비', month, '-0.6%'),
        y_yoy: getSummaryValue('손익요약_생산원가_연간누적_YOY', month, '95%')
      },
      {
        label: "매출이익",
        m_prev: formatNumber(getSummaryValue('손익요약_매출이익_당월실적_전년', month, '14985')),
        m_prev_p: getSummaryValue('손익요약_매출이익_당월실적_전년비율', month, '49.3%'),
        m_curr: formatNumber(getSummaryValue('손익요약_매출이익_당월실적_당년', month, '15669')),
        m_curr_p: getSummaryValue('손익요약_매출이익_당월실적_당년비율', month, '49.5%'),
        m_diff: formatDiff(getSummaryValue('손익요약_매출이익_당월실적_전년비', month, '684')),
        m_yoy: getSummaryValue('손익요약_매출이익_당월실적_YOY', month, '105%'),
        y_prev: formatNumber(getSummaryValue('손익요약_매출이익_연간누적_전년', month, '135713')),
        y_prev_p: getSummaryValue('손익요약_매출이익_연간누적_전년비율', month, '47.6%'),
        y_curr: formatNumber(getSummaryValue('손익요약_매출이익_연간누적_당년', month, '130388')),
        y_curr_p: getSummaryValue('손익요약_매출이익_연간누적_당년비율', month, '48.1%'),
        y_diff: formatDiff(getSummaryValue('손익요약_매출이익_연간누적_전년비', month, '-5325')),
        y_yoy: getSummaryValue('손익요약_매출이익_연간누적_YOY', month, '96%')
      },
      {
        label: "직접비",
        m_prev: formatNumber(getSummaryValue('손익요약_직접비_당월실적_전년', month, '5586')),
        m_prev_p: getSummaryValue('손익요약_직접비_당월실적_전년비율', month, '18.4%'),
        m_curr: formatNumber(getSummaryValue('손익요약_직접비_당월실적_당년', month, '5705')),
        m_curr_p: getSummaryValue('손익요약_직접비_당월실적_당년비율', month, '18.0%'),
        m_diff: formatDiff(getSummaryValue('손익요약_직접비_당월실적_전년비', month, '118')),
        m_yoy: getSummaryValue('손익요약_직접비_당월실적_YOY', month, '102%'),
        y_prev: formatNumber(getSummaryValue('손익요약_직접비_연간누적_전년', month, '54379')),
        y_prev_p: getSummaryValue('손익요약_직접비_연간누적_전년비율', month, '19.1%'),
        y_curr: formatNumber(getSummaryValue('손익요약_직접비_연간누적_당년', month, '54684')),
        y_curr_p: getSummaryValue('손익요약_직접비_연간누적_당년비율', month, '20.2%'),
        y_diff: formatDiff(getSummaryValue('손익요약_직접비_연간누적_전년비', month, '305')),
        y_yoy: getSummaryValue('손익요약_직접비_연간누적_YOY', month, '101%')
      },
      {
        label: "직접이익",
        m_prev: formatNumber(getSummaryValue('손익요약_직접이익_당월실적_전년', month, '9399')),
        m_prev_p: getSummaryValue('손익요약_직접이익_당월실적_전년비율', month, '30.9%'),
        m_curr: formatNumber(getSummaryValue('손익요약_직접이익_당월실적_당년', month, '9964')),
        m_curr_p: getSummaryValue('손익요약_직접이익_당월실적_당년비율', month, '31.5%'),
        m_diff: formatDiff(getSummaryValue('손익요약_직접이익_당월실적_전년비', month, '565')),
        m_yoy: getSummaryValue('손익요약_직접이익_당월실적_YOY', month, '106%'),
        y_prev: formatNumber(getSummaryValue('손익요약_직접이익_연간누적_전년', month, '81334')),
        y_prev_p: getSummaryValue('손익요약_직접이익_연간누적_전년비율', month, '28.5%'),
        y_curr: formatNumber(getSummaryValue('손익요약_직접이익_연간누적_당년', month, '75704')),
        y_curr_p: getSummaryValue('손익요약_직접이익_연간누적_당년비율', month, '27.9%'),
        y_diff: formatDiff(getSummaryValue('손익요약_직접이익_연간누적_전년비', month, '-5630')),
        y_yoy: getSummaryValue('손익요약_직접이익_연간누적_YOY', month, '93%')
      },
      {
        label: "영업비",
        m_prev: formatNumber(getSummaryValue('손익요약_영업비_당월실적_전년', month, '4483')),
        m_prev_p: getSummaryValue('손익요약_영업비_당월실적_전년비율', month, '14.8%'),
        m_curr: formatNumber(getSummaryValue('손익요약_영업비_당월실적_당년', month, '4659')),
        m_curr_p: getSummaryValue('손익요약_영업비_당월실적_당년비율', month, '14.7%'),
        m_diff: formatDiff(getSummaryValue('손익요약_영업비_당월실적_전년비', month, '176')),
        m_yoy: getSummaryValue('손익요약_영업비_당월실적_YOY', month, '104%'),
        y_prev: formatNumber(getSummaryValue('손익요약_영업비_연간누적_전년', month, '39996')),
        y_prev_p: getSummaryValue('손익요약_영업비_연간누적_전년비율', month, '14.0%'),
        y_curr: formatNumber(getSummaryValue('손익요약_영업비_연간누적_당년', month, '41759')),
        y_curr_p: getSummaryValue('손익요약_영업비_연간누적_당년비율', month, '15.4%'),
        y_diff: formatDiff(getSummaryValue('손익요약_영업비_연간누적_전년비', month, '1762')),
        y_yoy: getSummaryValue('손익요약_영업비_연간누적_YOY', month, '104%')
      },
      {
        label: "영업이익",
        m_prev: formatNumber(getSummaryValue('손익요약_영업이익_당월실적_전년', month, '4916')),
        m_prev_p: getSummaryValue('손익요약_영업이익_당월실적_전년비율', month, '16.2%'),
        m_curr: formatNumber(getSummaryValue('손익요약_영업이익_당월실적_당년', month, '5305')),
        m_curr_p: getSummaryValue('손익요약_영업이익_당월실적_당년비율', month, '16.8%'),
        m_diff: formatDiff(getSummaryValue('손익요약_영업이익_당월실적_전년비', month, '389')),
        m_yoy: getSummaryValue('손익요약_영업이익_당월실적_YOY', month, '108%'),
        y_prev: formatNumber(getSummaryValue('손익요약_영업이익_연간누적_전년', month, '41337')),
        y_prev_p: getSummaryValue('손익요약_영업이익_연간누적_전년비율', month, '14.5%'),
        y_curr: formatNumber(getSummaryValue('손익요약_영업이익_연간누적_당년', month, '33945')),
        y_curr_p: getSummaryValue('손익요약_영업이익_연간누적_당년비율', month, '12.5%'),
        y_diff: formatDiff(getSummaryValue('손익요약_영업이익_연간누적_전년비', month, '-7392')),
        y_yoy: getSummaryValue('손익요약_영업이익_연간누적_YOY', month, '82%')
      }
    ];
    
    return rows;
  }, [summaryData, currentSelectedMonth, loadingDashboard]);
  
  // 직접비요약 데이터 생성
  const directExpenseSummaryData = React.useMemo(() => {
    const month = currentSelectedMonth;
    if (loadingDashboard || Object.keys(summaryData).length === 0) {
      return null;
    }
    
    const formatNumber = (val: string): string => {
      if (!val || val === '' || val === '-') return '';
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return num.toLocaleString('en-US');
    };
    
    const formatDiff = (val: string): string => {
      if (!val || val === '' || val === '-') return '';
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return num >= 0 ? `+$${formatNumber(val.replace(/[^0-9.-]/g, ''))}K` : `-$${formatNumber(Math.abs(num).toString())}K`;
    };
    
    // 퍼센트 값을 소수점 첫째 자리까지 표시하는 함수 (2.90% -> 2.9%, 3.80% -> 3.8%)
    const formatPercentRound = (val: string): string => {
      if (!val || val === '' || val === '-') return val;
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return `${num.toFixed(1)}%`;
    };
    
    return [
      {
        title: "전체 직접비율",
        value: { 
          누적: `$${formatNumber(getSummaryValue('직접비요약_전체직접비율_누적_값', month, '5704.8'))}K`, 
          당월: `$${formatNumber(getSummaryValue('직접비요약_전체직접비율_당월_값', month, '4850.5'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('직접비요약_전체직접비율_누적_YOY', month, '102.1%'), 
          당월: getSummaryValue('직접비요약_전체직접비율_당월_YOY', month, '103.2%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('직접비요약_전체직접비율_누적_전년비', month, '118')), 
          당월: formatDiff(getSummaryValue('직접비요약_전체직접비율_당월_전년비', month, '95')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_전체직접비율_누적_당년비율', month, '18.0%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_전체직접비율_누적_전년비율', month, '18.4%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_전체직접비율_누적_감소율', month, '-0.4%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_전체직접비율_당월_당년비율', month, '17.8%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_전체직접비율_당월_전년비율', month, '18.5%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_전체직접비율_당월_감소율', month, '-0.7%p')}</span></div>
          </>
        }
      },
      {
        title: "SEM광고비",
        value: { 
          누적: `$${formatNumber(getSummaryValue('직접비요약_SEM광고비_누적_값', month, '11205'))}K`, 
          당월: `$${formatNumber(getSummaryValue('직접비요약_SEM광고비_당월_값', month, '1313.5'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('직접비요약_SEM광고비_누적_YOY', month, '98.1%'), 
          당월: getSummaryValue('직접비요약_SEM광고비_당월_YOY', month, '97.4%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('직접비요약_SEM광고비_누적_전년비', month, '-215')), 
          당월: formatDiff(getSummaryValue('직접비요약_SEM광고비_당월_전년비', month, '-35')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_SEM광고비_누적_당년비율', month, '4.3%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_SEM광고비_누적_전년비율', month, '4.5%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_SEM광고비_누적_감소율', month, '-0.2%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_SEM광고비_당월_당년비율', month, '4.2%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_SEM광고비_당월_전년비율', month, '4.4%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_SEM광고비_당월_감소율', month, '-0.2%p')}</span></div>
          </>
        }
      },
      {
        title: "운반비",
        value: { 
          누적: `$${formatNumber(getSummaryValue('직접비요약_운반비_누적_값', month, '15240'))}K`, 
          당월: `$${formatNumber(getSummaryValue('직접비요약_운반비_당월_값', month, '1805'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('직접비요약_운반비_누적_YOY', month, '99.2%'), 
          당월: getSummaryValue('직접비요약_운반비_당월_YOY', month, '98.0%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('직접비요약_운반비_누적_전년비', month, '-125')), 
          당월: formatDiff(getSummaryValue('직접비요약_운반비_당월_전년비', month, '-35')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_운반비_누적_당년비율', month, '13.0%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_운반비_누적_전년비율', month, '14.0%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_운반비_누적_증감율', month, '-0.5%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_운반비_당월_당년비율', month, '12.5%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_운반비_당월_전년비율', month, '13.5%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_운반비_당월_증감율', month, '-1.0%p')}</span></div>
          </>
        }
      },
      {
        title: "보관료",
        value: { 
          누적: `$${formatNumber(getSummaryValue('직접비요약_보관료_누적_값', month, '6890'))}K`, 
          당월: `$${formatNumber(getSummaryValue('직접비요약_보관료_당월_값', month, '809.6'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('직접비요약_보관료_누적_YOY', month, '121.5%'), 
          당월: getSummaryValue('직접비요약_보관료_당월_YOY', month, '123.4%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('직접비요약_보관료_누적_전년비', month, '1180')), 
          당월: formatDiff(getSummaryValue('직접비요약_보관료_당월_전년비', month, '154')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_보관료_누적_당년비율', month, '26.2%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_보관료_누적_전년비율', month, '28.0%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_보관료_누적_감소율', month, '-1.8%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_보관료_당월_당년비율', month, '26.0%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_보관료_당월_전년비율', month, '27.8%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_보관료_당월_감소율', month, '-1.8%p')}</span></div>
          </>
        }
      },
      {
        title: "지급수수료",
        value: { 
          누적: `$${formatNumber(getSummaryValue('직접비요약_지급수수료_누적_값', month, '72450'))}K`, 
          당월: `$${formatNumber(getSummaryValue('직접비요약_지급수수료_당월_값', month, '8537'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('직접비요약_지급수수료_누적_YOY', month, '104.8%'), 
          당월: getSummaryValue('직접비요약_지급수수료_당월_YOY', month, '105.0%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('직접비요약_지급수수료_누적_전년비', month, '3240')), 
          당월: formatDiff(getSummaryValue('직접비요약_지급수수료_당월_전년비', month, '373')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_지급수수료_누적_당년비율', month, '9.2%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_지급수수료_누적_전년비율', month, '8.7%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_지급수수료_누적_증감율', month, '+0.5%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_지급수수료_당월_당년비율', month, '9.1%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('직접비요약_지급수수료_당월_전년비율', month, '8.4%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('직접비요약_지급수수료_당월_증감율', month, '+0.7%p')}</span></div>
          </>
        }
      }
    ];
  }, [summaryData, currentSelectedMonth, loadingDashboard]);
  
  // 영업비요약 데이터 생성 (유사한 구조로 추가 필요)
  const operatingExpenseSummaryData = React.useMemo(() => {
    const month = currentSelectedMonth;
    if (loadingDashboard || Object.keys(summaryData).length === 0) {
      return null;
    }
    
    const formatNumber = (val: string): string => {
      if (!val || val === '' || val === '-') return '';
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return num.toLocaleString('en-US');
    };
    
    const formatDiff = (val: string): string => {
      if (!val || val === '' || val === '-') return '';
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return num >= 0 ? `+$${formatNumber(val.replace(/[^0-9.-]/g, ''))}K` : `-$${formatNumber(Math.abs(num).toString())}K`;
    };
    
    // 퍼센트 값을 소수점 첫째 자리까지 표시하는 함수 (2.90% -> 2.9%, 3.80% -> 3.8%)
    const formatPercentRound = (val: string): string => {
      if (!val || val === '' || val === '-') return val;
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      if (isNaN(num)) return val;
      return `${num.toFixed(1)}%`;
    };
    
    return [
      {
        title: "전체 영업비용",
        value: { 
          누적: `$${formatNumber(getSummaryValue('영업비요약_전체영업비용_누적_값', month, '39560'))}K`, 
          당월: `$${formatNumber(getSummaryValue('영업비요약_전체영업비용_당월_값', month, '4659'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('영업비요약_전체영업비용_누적_YOY', month, '104.2%'), 
          당월: getSummaryValue('영업비요약_전체영업비용_당월_YOY', month, '103.9%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('영업비요약_전체영업비용_누적_전년비', month, '1485')), 
          당월: formatDiff(getSummaryValue('영업비요약_전체영업비용_당월_전년비', month, '176')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_전체영업비용_누적_당년비율', month, '1.3%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_전체영업비용_누적_전년비율', month, '1.3%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('영업비요약_전체영업비용_누적_증가율', month, '0.0%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_전체영업비용_당월_당년비율', month, '1.3%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_전체영업비용_당월_전년비율', month, '1.3%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('영업비요약_전체영업비용_당월_증가율', month, '0.0%p')}</span></div>
          </>
        }
      },
      {
        title: "인건비",
        value: { 
          누적: `$${formatNumber(getSummaryValue('영업비요약_인건비_누적_값', month, '15680'))}K`, 
          당월: `$${formatNumber(getSummaryValue('영업비요약_인건비_당월_값', month, '1843'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('영업비요약_인건비_누적_YOY', month, '103.1%'), 
          당월: getSummaryValue('영업비요약_인건비_당월_YOY', month, '102.7%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('영업비요약_인건비_누적_전년비', month, '485')), 
          당월: formatDiff(getSummaryValue('영업비요약_인건비_당월_전년비', month, '48')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>영업비 구성비:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_인건비_누적_영업비구성비', month, '39.6%'))}</span></div>
            <div className="flex justify-between"><span>인원수:</span><span className="font-medium">{getSummaryValue('영업비요약_인건비_누적_인원수', month, '136명')}</span></div>
            <div className="flex justify-between"><span>인당 인건비:</span><span className="font-medium">{(() => {
              const val = getSummaryValue('영업비요약_인건비_누적_인당인건비', month, '115.3K USD');
              return val.replace('K USD', 'K').replace(/(\d+(\.\d+)?)K/, '$$1K');
            })()}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>영업비 구성비:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_인건비_당월_영업비구성비', month, '39.6%'))}</span></div>
            <div className="flex justify-between"><span>인원수:</span><span className="font-medium">{getSummaryValue('영업비요약_인건비_당월_인원수', month, '136명')}</span></div>
            <div className="flex justify-between"><span>인당 인건비:</span><span className="font-medium">{(() => {
              const val = getSummaryValue('영업비요약_인건비_당월_인당인건비', month, '13.6K USD');
              return val.replace('K USD', 'K').replace(/(\d+(\.\d+)?)K/, '$$1K');
            })()}</span></div>
          </>
        }
      },
      {
        title: "일반광고비",
        value: { 
          누적: `$${formatNumber(getSummaryValue('영업비요약_일반광고비_누적_값', month, '7650'))}K`, 
          당월: `$${formatNumber(getSummaryValue('영업비요약_일반광고비_당월_값', month, '898'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('영업비요약_일반광고비_누적_YOY', month, '76.8%'), 
          당월: getSummaryValue('영업비요약_일반광고비_당월_YOY', month, '75.6%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('영업비요약_일반광고비_누적_전년비', month, '-2315')), 
          당월: formatDiff(getSummaryValue('영업비요약_일반광고비_당월_전년비', month, '-289')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_일반광고비_누적_당년비율', month, '2.9%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_일반광고비_누적_전년비율', month, '4.0%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('영업비요약_일반광고비_누적_감소율', month, '-1.1%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_일반광고비_당월_당년비율', month, '2.8%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_일반광고비_당월_전년비율', month, '3.9%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('영업비요약_일반광고비_당월_감소율', month, '-1.1%p')}</span></div>
          </>
        }
      },
      {
        title: "지급수수료",
        value: { 
          누적: `$${formatNumber(getSummaryValue('영업비요약_지급수수료_누적_값', month, '8785'))}K`, 
          당월: `$${formatNumber(getSummaryValue('영업비요약_지급수수료_당월_값', month, '1034'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('영업비요약_지급수수료_누적_YOY', month, '104.5%'), 
          당월: getSummaryValue('영업비요약_지급수수료_당월_YOY', month, '103.4%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('영업비요약_지급수수료_누적_전년비', month, '3125')), 
          당월: formatDiff(getSummaryValue('영업비요약_지급수수료_당월_전년비', month, '366')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_지급수수료_누적_당년비율', month, '3.9%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_지급수수료_누적_전년비율', month, '3.6%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('영업비요약_지급수수료_누적_증감율', month, '+0.3%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_지급수수료_당월_당년비율', month, '4.1%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_지급수수료_당월_전년비율', month, '3.8%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('영업비요약_지급수수료_당월_증감율', month, '+0.3%p')}</span></div>
          </>
        }
      },
      {
        title: "임차료",
        value: { 
          누적: `$${formatNumber(getSummaryValue('영업비요약_임차료_누적_값', month, '21645'))}K`, 
          당월: `$${formatNumber(getSummaryValue('영업비요약_임차료_당월_값', month, '2547'))}K` 
        },
        yoy: { 
          누적: getSummaryValue('영업비요약_임차료_누적_YOY', month, '111.2%'), 
          당월: getSummaryValue('영업비요약_임차료_당월_YOY', month, '110.5%') 
        },
        yoyDiff: { 
          누적: formatDiff(getSummaryValue('영업비요약_임차료_누적_전년비', month, '2190')), 
          당월: formatDiff(getSummaryValue('영업비요약_임차료_당월_전년비', month, '242')) 
        },
        details: {
          누적: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_임차료_누적_당년비율', month, '8.2%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_임차료_누적_전년비율', month, '7.7%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('영업비요약_임차료_누적_증가율', month, '0.5%p')}</span></div>
          </>,
          당월: <>
            <div className="flex justify-between"><span>당년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_임차료_당월_당년비율', month, '8.1%'))}</span></div>
            <div className="flex justify-between"><span>전년비율:</span><span className="font-medium">{formatPercentRound(getSummaryValue('영업비요약_임차료_당월_전년비율', month, '7.6%'))}</span></div>
            <div className="flex justify-between"><span>증감율:</span><span className="font-medium text-gray-500">{getSummaryValue('영업비요약_임차료_당월_증가율', month, '0.5%p')}</span></div>
          </>
        }
      }
    ];
  }, [summaryData, currentSelectedMonth, loadingDashboard]);
  
  // 차트 데이터 생성 (CSV에서 로드)
  const chartDataForComponents = React.useMemo(() => {
    if (loadingDashboard || Object.keys(dashboardData).length === 0) {
      return null;
    }
    
    const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01'];
    
    // 채널별 매출 추세 데이터
    const channelSalesData: Record<string, number[]> = {};
    // CSV 키와 표시 이름 매핑
    const channelKeys = ['US홀세일', 'USEC', 'EUEC', '라이선스'];
    channelKeys.forEach(csvKey => {
      const dataKey = `차트_채널별매출추세_${csvKey}`;
      channelSalesData[dataKey] = months.map(month => {
        const val = getDataValue(dataKey, month, '0');
        return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
      });
      const yoyKey = `${dataKey}_YOY`;
      channelSalesData[yoyKey] = months.map(month => {
        const val = getDataValue(yoyKey, month, '0');
        return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
      });
      // 표시 이름으로도 저장 (US EC -> USEC, EU EC -> EUEC 매핑)
      const displayKey = csvKey === 'USEC' ? 'USEC' : csvKey === 'EUEC' ? 'EUEC' : csvKey;
      if (displayKey !== csvKey || csvKey === 'USEC' || csvKey === 'EUEC') {
        channelSalesData[`차트_채널별매출추세_${displayKey}`] = channelSalesData[dataKey];
        channelSalesData[`차트_채널별매출추세_${displayKey}_YOY`] = channelSalesData[yoyKey];
      }
    });
    const totalChannelYoyKey = '차트_채널별매출추세_TOTAL_YOY';
    channelSalesData[totalChannelYoyKey] = months.map(month => {
      const val = getDataValue(totalChannelYoyKey, month, '0');
      return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
    });
    
    // 아이템별 매출 추세 데이터
    const itemSalesData: Record<string, number[]> = {};
    const itemNames = ['25FW', '25SS', 'FW과시즌', 'SS과시즌', 'CORE'];
    itemNames.forEach(item => {
      const dataKey = `차트_아이템별매출추세_${item}`;
      itemSalesData[dataKey] = months.map(month => {
        const val = getDataValue(dataKey, month, '0');
        return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
      });
      const yoyKey = `${dataKey}_YOY`;
      itemSalesData[yoyKey] = months.map(month => {
        const val = getDataValue(yoyKey, month, '0');
        return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
      });
    });
    const totalItemYoyKey = '차트_아이템별매출추세_TOTAL_YOY';
    itemSalesData[totalItemYoyKey] = months.map(month => {
      const val = getDataValue(totalItemYoyKey, month, '0');
      return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
    });
    
    // 아이템별 재고 추세 데이터
    const inventoryData: Record<string, number[]> = {};
    const inventoryMapping: Record<string, string> = {
      '25FW': '25FW',
      '25SS': '25SS',
      'FW과시즌': 'FW과시즌',
      'SS과시즌': 'SS과시즌',
      'CORE': 'CORE'
    };
    Object.entries(inventoryMapping).forEach(([displayName, csvKey]) => {
      const dataKey = `차트_아이템별재고추세_${csvKey}`;
      const yoyKey = `${dataKey}_YOY`;
      
      inventoryData[dataKey] = months.map(month => {
        const val = getDataValue(dataKey, month, '0');
        // 재고 데이터: CSV 값을 그대로 사용 (콤마 제거 후 숫자로 변환)
        const numValue = parseFloat(val.replace(/,/g, '')) || 0;
        return numValue;
      });
      
      // YOY 데이터 로딩 (0%도 그대로 유지, 값이 없을 때만 100으로 대체)
      inventoryData[yoyKey] = months.map(month => {
        const val = getDataValue(yoyKey, month, '100%');
        const parsed = parseFloat(val.replace(/[%]/g, ''));
        return isNaN(parsed) ? 100 : parsed;
      });

      // displayName을 키로도 저장 (컴포넌트에서 사용)
      const displayKey = `차트_아이템별재고추세_${displayName.replace(/ /g, '').replace(/&/g, '')}`;
      inventoryData[displayKey] = inventoryData[dataKey];
      inventoryData[`${displayKey}_YOY`] = inventoryData[yoyKey];
    });
    const totalInventoryYoyKey = '차트_아이템별재고추세_TOTAL_YOY';
    inventoryData[totalInventoryYoyKey] = months.map(month => {
      const val = getDataValue(totalInventoryYoyKey, month, '0');
      return parseFloat(val.replace(/[^0-9.-]/g, '')) || 0;
    });
    
    return {
      channelSales: channelSalesData,
      itemSales: itemSalesData,
      inventory: inventoryData
    };
  }, [dashboardData, currentSelectedMonth, loadingDashboard]);
  
  // 팝업 데이터 준비 (SEM광고비, 재고소진계획, 운반비)
  const popupData = React.useMemo(() => {
    if (loadingDashboard || Object.keys(dashboardData).length === 0 || Object.keys(summaryData).length === 0) {
      return null;
    }
    
      const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];
      const monthLabels = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
      
      const monthMapping: Record<string, string> = {
        '2025-01': '25-Jan',
        '2025-02': '25-Feb',
        '2025-03': '25-Mar',
        '2025-04': '25-Apr',
        '2025-05': '25-May',
        '2025-06': '25-Jun',
        '2025-07': '25-Jul',
        '2025-08': '25-Aug',
        '2025-09': '25-Sep',
        '2025-10': '25-Oct',
        '2025-11': '25-Nov',
        '2025-12': '25-Dec'
      };

      const getValue = (key: string, month: string, defaultValue: string = '') => {
        const csvMonthKey = monthMapping[month] || month;
        if (!dashboardData[key] || !dashboardData[key][csvMonthKey]) {
          return defaultValue;
        }
        return dashboardData[key][csvMonthKey];
      };
      
      // SEM광고비 팝업 데이터
      const semChartData = months.map((month, idx) => {
        const sales = parseFloat(getValue('팝업_SEM광고비_sales', month, '0').replace(/[,%]/g, '')) || 0;
        const adSpend = parseFloat(getValue('팝업_SEM광고비_adSpend', month, '0').replace(/[,%]/g, '')) || 0;
        const ratio2025 = parseFloat(getValue('팝업_SEM광고비_ratio2025', month, '0').replace(/[,%]/g, '')) || 0;
        const ratio2024 = parseFloat(getValue('팝업_SEM광고비_ratio2024', month, '0').replace(/[,%]/g, '')) || 0;
        return {
          month: monthLabels[idx],
          sales,
          adSpend,
          ratio2025,
          ratio2024
        };
      });
      
      const latestMonthForSem = months[months.length - 1];
      const latestMonthNumber = latestMonthForSem.split('-')[1];
      const semTextData = {
        yoyText: getValue('팝업_SEM광고비_YOY_텍스트', latestMonthForSem, "25.11월 전년대비 +1.0%p 증가 (당년 11월 15.0% vs 전년 14.0%)"),
        desc1: getValue('팝업_SEM광고비_설명1', latestMonthForSem, "9월, 10월 SEM채널 Test 완료 후, 11월 효율 높은 채널에 집중하여, 비용율 16.1% 평균 이하로 관리"),
        desc2: getValue('팝업_SEM광고비_설명2', latestMonthForSem, "")
      };
    
    // SEM광고비 누적 데이터 계산
    const semCumulativeSales = semChartData.reduce((sum, d) => sum + d.sales, 0);
    const semCumulativeAdSpend = semChartData.reduce((sum, d) => sum + d.adSpend, 0);
    const semAvgRatio = semChartData.length > 0 ? (semCumulativeAdSpend / semCumulativeSales * 100).toFixed(0) : '0';
    
    // 재고소진계획 팝업 데이터 - CSV의 각 컬럼이 3월부터 11월까지 데이터를 나타냄
    const inventoryChartData: any[] = [];
    const inventoryTableData: any[] = [];
    
    // 3월부터 12월까지 데이터 수집 (CSV 컬럼 매핑: 25-Jan -> 3월, ..., 25-Oct -> 12월, 25-Nov -> 1월)
    const inventoryMonths = ['3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월', '1월'];
    // CSV 헤더와 매핑 (사용자 요청: 25-Jan 컬럼을 3월 데이터로 사용하여 12월까지 표시, 25-Nov를 1월로 추가)
    const csvMonthKeys = ['25-Jan', '25-Feb', '25-Mar', '25-Apr', '25-May', '25-Jun', '25-Jul', '25-Aug', '25-Sep', '25-Oct', '25-Nov'];
    
    inventoryMonths.forEach((monthLabel, idx) => {
      const csvMonthKey = csvMonthKeys[idx]; // CSV 컬럼 키 (각 컬럼이 한 달을 나타냄)
      const getValue = (key: string, month: string, defaultValue: string = '') => {
        if (!dashboardData[key] || !dashboardData[key][month]) {
          return defaultValue;
        }
        return dashboardData[key][month];
      };
      // 데이터 키값은 그대로 유지 (기존 코드 참조)
      const fw25 = parseFloat(getValue('팝업_재고소진계획_fw25_3월', csvMonthKey, '0').replace(/,/g, '')) || 0;
      const ss25 = parseFloat(getValue('팝업_재고소진계획_ss25_3월', csvMonthKey, '0').replace(/,/g, '')) || 0;
      const fw24 = parseFloat(getValue('팝업_재고소진계획_FW과시즌_3월', csvMonthKey, '0').replace(/,/g, '')) || 0;
      const core = parseFloat(getValue('팝업_재고소진계획_SS과시즌_3월', csvMonthKey, '0').replace(/,/g, '')) || 0;
      const past = parseFloat(getValue('팝업_재고소진계획_CORE_3월', csvMonthKey, '0').replace(/,/g, '')) || 0;
      const total = parseFloat(getValue('팝업_재고소진계획_테이블_3월', csvMonthKey, '0').replace(/,/g, '')) || 0;
      
      inventoryChartData.push({
        month: monthLabel,
        fw25,
        ss25,
        fw24,
        core,
        past
      });
      
      // 테이블 데이터 추가 (헤더 이름 설정)
      let period = '';
      if (monthLabel === '11월') {
        period = '25.11실적';
      } else if (monthLabel === '12월') {
        period = '25.12실적';
      } else if (monthLabel === '1월') {
        period = '26.1실적';
      } else {
        const periodLabel = monthLabel.replace('월', '');
        period = `25.${periodLabel}실적`;
      }
      
      inventoryTableData.push({
        period,
        total
      });
    });
    
    // 운반비 팝업 데이터 (3월부터 10월까지) - summaryData에서 읽기
    const getSummaryValueForPopup = (key: string, month: string, defaultValue: string = '0') => {
      const csvMonthKey = monthMapping[month] || month;
      if (!summaryData[key] || !summaryData[key][csvMonthKey]) {
        return defaultValue;
      }
      return summaryData[key][csvMonthKey];
    };
    
    const shippingMonths = ['2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];
    const shippingLabels = ['3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const shippingChartData = shippingMonths.map((month, idx) => {
      const usCost = parseFloat(getSummaryValueForPopup('팝업_운반비_US건당단가', month, '0').replace(/[,$]/g, '')) || 0;
      const euCost = parseFloat(getSummaryValueForPopup('팝업_운반비_EU건당단가', month, '0').replace(/[,$]/g, '')) || 0;
      const euBurden = parseFloat(getSummaryValueForPopup('팝업_운반비_EU고객부담%', month, '0').replace(/[%,]/g, '')) || 0;
      return {
        month: shippingLabels[idx],
        usCost,
        euCost,
        euBurden
      };
    });
    
    return {
      semAd: {
        chartData: semChartData,
        textData: semTextData,
        cumulative: {
          sales: semCumulativeSales,
          adSpend: semCumulativeAdSpend,
          avgRatio: semAvgRatio
        }
      },
      inventoryPlan: {
        chartData: inventoryChartData,
        tableData: inventoryTableData
      },
      shippingCost: {
        chartData: shippingChartData
      }
    };
  }, [dashboardData, summaryData, loadingDashboard]);
  
  const tabs = [
    { id: "대시보드", label: "대시보드", icon: BarChart3Icon },
    { id: "손익계산서", label: "손익계산서", icon: TrendingUpIcon },
    { id: "재무상태표", label: "재무상태표", icon: BriefcaseIcon },
    { id: "현금흐름표", label: "현금흐름표", icon: WalletIcon },
    { id: "영업비 분석", label: "영업비 분석", icon: BarChart3Icon },
  ];
  
  // 조회 기준 변경 핸들러 (현재 활성 탭의 월만 변경)
  const handleMonthChange = (month: string) => {
    setTabSelectedMonths(prev => ({
      ...prev,
      [activeTab]: month
    }));
  };
  
  return (
    <div className="flex min-h-screen flex-col bg-slate-50/50">
      {/* Header Section */}
      <div className="bg-slate-900 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-white">STO 경영실적 대시보드</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-white">조회 기준:</span>
          <Select value={currentSelectedMonth} onValueChange={handleMonthChange}>
              <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="2026년 01월" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-01">2025년 01월</SelectItem>
              <SelectItem value="2025-02">2025년 02월</SelectItem>
              <SelectItem value="2025-03">2025년 03월</SelectItem>
              <SelectItem value="2025-04">2025년 04월</SelectItem>
              <SelectItem value="2025-05">2025년 05월</SelectItem>
              <SelectItem value="2025-06">2025년 06월</SelectItem>
              <SelectItem value="2025-07">2025년 07월</SelectItem>
              <SelectItem value="2025-08">2025년 08월</SelectItem>
              <SelectItem value="2025-09">2025년 09월</SelectItem>
              <SelectItem value="2025-10">2025년 10월</SelectItem>
              <SelectItem value="2025-11">2025년 11월</SelectItem>
              <SelectItem value="2025-12">2025년 12월</SelectItem>
              <SelectItem value="2026-01">2026년 01월</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <main className="flex-1 p-6 space-y-6 max-w-[2400px] mx-auto w-full overflow-x-hidden">
        
        {/* Tab Navigation */}
        <div className="bg-gray-100 rounded-lg p-2 flex items-center gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                activeTab === tab.id 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-transparent text-gray-700 hover:bg-gray-200"
              )}
            >
              <tab.icon className={cn("h-5 w-5", activeTab === tab.id ? "text-white" : "text-gray-600")} />
              <span className="font-medium">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* 손익계산서 탭 콘텐츠 */}
        {activeTab === "손익계산서" && (
          <>
            <IncomeStatementSection selectedMonth={currentSelectedMonth} />
            <STEIncomeStatementSection />
          </>
        )}
        
        {/* 재무상태표 탭 콘텐츠 */}
        {activeTab === "재무상태표" && <BalanceSheetSection selectedMonth={currentSelectedMonth} />}
        
        {/* 현금흐름표 탭 콘텐츠 */}
        {activeTab === "현금흐름표" && <CashFlowSection selectedMonth={currentSelectedMonth} />}
        
        {/* 영업비 분석 탭 콘텐츠 */}
        {activeTab === "영업비 분석" && <OperatingExpenseSection selectedMonth={currentSelectedMonth} />}
        
        {/* 대시보드 탭 콘텐츠 */}
        {activeTab === "대시보드" && (
          <>
            {/* 실적 요약 및 CEO 인사이트 */}
            <div className="space-y-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            실적 요약 및 CEO 인사이트
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EditableInsightCard
              title="핵심 성과"
              icon={LightbulbIcon}
              defaultItems={[
                "역대 최고 실적: $3,535K 매출, YOY 155% 달성",
                "US EC 압도적 성장: $3,327K (비중 94%), YOY 170% 달성",
                "25FW 본격화: $1,690K 매출, 전체 비중 50% 차지"
              ]}
              storageKey="ceo-insights-key-performance-v4"
              cardClassName="bg-gradient-to-br from-purple-100 to-purple-50 border-l-4 border-l-purple-500 rounded-none"
              titleClassName="text-purple-700"
            />
            <EditableInsightCard
              title="주요 리스크"
              icon={AlertTriangleIcon}
              defaultItems={[
                "할인율 급등: 57.1%로 전년 대비 +17.6%p, US EC 56.8% (전년 대비 +18.7%p)",
                "US EC $3.3M 매출에도 불구, 직접이익 적자 56.8%의 할인율 및 SEM 비용: $840K (25.3%)",
                "재고 부담: $23,133K YOY 183% (전월대비 $7,943K 소진) 25SS 잔여 재고 $6,766K",
                "SEM CPM 단가: 12월 최대 $34, 평균 $24 (vs 평월 $10)"
              ]}
              storageKey="ceo-insights-major-risks-v4"
              cardClassName="bg-gradient-to-br from-blue-100 to-blue-50 border-l-4 border-l-blue-500 rounded-none"
              titleClassName="text-blue-700"
            />
            <EditableInsightCard
              title="CEO 전략 방향"
              icon={TargetIcon}
              defaultItems={[
                "할인율 관리: 재고소진 목적의 할인정책과 당신즌 구분하여 할인정책 적용 (25SS 70%, 25FW 50% 할인중)",
                "EC 온라인 수익성 회복: 직접이익률 25% 이상 회복 위해, SEM 광고비 효율성 관점 투자",
                "단일 아이템 집중: US EC Track Jacket/Pant 매출 비중 당년 70% (매출 YoY 170%)",
                "CORE 할인 관리: CORE 단종 예정 SKU 소진 위한 12월~1월초 할인효과 반영. 1월 8일 부 CORE 할인율 정책 0%~3%로 관리"
              ]}
              storageKey="ceo-insights-strategy-v6"
              cardClassName="bg-gradient-to-br from-green-100 to-green-50 border-l-4 border-l-green-500 rounded-none"
              titleClassName="text-green-700"
            />
          </div>
        </div>

        {/* Main Metrics Row 1 */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🏢 STO 미국 법인 경영실적
          </h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExpandAllDetails(!expandAllDetails)}
          >
            {expandAllDetails ? "접기" : "전체 보기"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {loadingDashboard ? (
             <div className="col-span-4 text-center text-gray-500 py-8">데이터 로딩 중...</div>
           ) : cardData ? (
             <>
               <DetailedMetricCard
                   title="📊 실판매출"
                   value={cardData.salesCard.value}
                   yoy={cardData.salesCard.yoy}
                   salesShare={cardData.salesCard.salesShare}
                   trend="up"
                   expandAll={expandAllDetails}
                   channelDetails={cardData.salesCard.channelDetails}
                   itemDetails={cardData.salesCard.itemDetails}
               />
               <DetailedMetricCard
                   title="🏷️ 할인율"
                   value={cardData.discountCard.value}
                   yoy={cardData.discountCard.yoy}
                   trend="up"
                   expandAll={expandAllDetails}
                   channelDetails={cardData.discountCard.channelDetails}
                   itemDetails={cardData.discountCard.itemDetails}
               />
               <DetailedMetricCard
                   title="💰 직접이익"
                   value={cardData.profitCard.value}
                   yoy={cardData.profitCard.yoy}
                   profitMargin={cardData.profitCard.profitMargin}
                   trend="up"
                   expandAll={expandAllDetails}
                   channelProfitDetails={cardData.profitCard.channelProfitDetails}
                   directProfitYtdDetails={cardData.profitCard.directProfitYtdDetails}
                  directProfitPopupData={directProfitPopupData}
               />
               <DetailedMetricCard
                   title="📈 영업비"
                   value={cardData.expenseCard.value}
                   yoy={cardData.expenseCard.yoy}
                   operatingExpenseRatio={cardData.expenseCard.operatingExpenseRatio}
                   trend="down"
                   expandAll={expandAllDetails}
                   expenseBreakdown={cardData.expenseCard.expenseBreakdown}
               />
             </>
           ) : null}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {loadingDashboard || !cardData ? (
             <>
               <MetricCard title="📈 당시즌 판매율" value="16.6%" subValue="전년 21.1%" subValueColor="text-red-500" description="YoY -4.5%p" />
               <MetricCard title="🎯 US EC 25FW M/U" value="5.22" subValue="전년대비 5.48" subValueColor="text-red-500" description="YoY -0.26" />
               <MetricCard title="🏭 기말재고" value="3,309.8억" subValue="전년 3,412.2억" subValueColor="text-green-500" description="YoY 97.0%" />
               <MetricCard title="👥 인원수" value="136명" subValue="전년 140명" subValueColor="text-green-500" description="YoY -4명" />
             </>
           ) : (
             <>
               <MetricCard 
                 title="📈 US EC 25FW 판매율" 
                 value={cardData.metricCards.salesRate.value} 
                 subValue={cardData.metricCards.salesRate.subValue} 
                 subValueColor={cardData.metricCards.salesRate.subValueColor} 
                 description={cardData.metricCards.salesRate.description} 
                 itemDetails={cardData.metricCards.salesRate.itemDetails}
                 expandAll={expandAllDetails}
               />
               <MetricCard 
                 title="🎯 US EC 25FW M/U" 
                 value={cardData.metricCards.mu.value} 
                 subValue={cardData.metricCards.mu.subValue} 
                 subValueColor={cardData.metricCards.mu.subValueColor} 
                 description={cardData.metricCards.mu.description} 
                 topStoresDetails={cardData.metricCards.mu.topStoresDetails}
                 expandAll={expandAllDetails}
               />
               <MetricCard 
                 title="🏭 기말재고" 
                 value={cardData.metricCards.inventory.value} 
                 subValue={cardData.metricCards.inventory.subValue} 
                 subValueColor={cardData.metricCards.inventory.subValueColor} 
                 description={cardData.metricCards.inventory.description} 
                 topStoresDetails={cardData.metricCards.inventory.topStoresDetails}
                 detailsTitle="아이템별 기말재고"
                 expandAll={expandAllDetails}
               >
                 <Dialog>
                   <DialogTrigger asChild>
                     <Button variant="outline" size="sm" className="w-full text-xs h-7 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800">
                       25SS 재고소진 계획 상세보기
                     </Button>
                   </DialogTrigger>
                   <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                     <DialogHeader>
                       <DialogTitle>25SS 재고소진 계획</DialogTitle>
                     </DialogHeader>
                     <InventoryPlanDialog data={popupData?.inventoryPlan} />
                   </DialogContent>
                 </Dialog>
               </MetricCard>
               <MetricCard 
                 title="👥 인원수" 
                 value={cardData.metricCards.headcount.value} 
                 subValue={cardData.metricCards.headcount.subValue} 
                 subValueColor={cardData.metricCards.headcount.subValueColor} 
                 description={cardData.metricCards.headcount.description} 
                 statsDetails={cardData.metricCards.headcount.statsDetails}
                 expandAll={expandAllDetails}
               />
             </>
           )}
        </div>

        {/* Profit & Loss Table */}
         <div className="space-y-4">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <h3 className="font-bold text-2xl">손익요약</h3>
           </div>
           <Card className="overflow-hidden border-t-4 border-t-green-500">
             <CardHeader className="bg-slate-50/50 py-4 border-b">
                {currentSelectedMonth === '2025-10' && (
                  <CardDescription className="text-green-700 font-bold">
                    당월 실판 매출 $1,936K, 영업이익 -$389K 적자
                  </CardDescription>
                )}
             </CardHeader>
             <CardContent className="p-0 overflow-x-auto">
               <Table>
                 <TableHeader>
                   <TableRow className="bg-slate-100/50 text-sm hover:bg-slate-100/50">
                     <TableHead className="w-[150px] text-center font-bold border-r">지표명</TableHead>
                     <TableHead className="text-center font-bold text-blue-700 bg-blue-50" colSpan={6}>당월 실적</TableHead>
                     <TableHead className="text-center font-bold w-2 bg-white"></TableHead>
                     <TableHead className="w-[150px] text-center font-bold border-r">지표명</TableHead>
                     <TableHead className="text-center font-bold text-purple-700 bg-purple-50" colSpan={6}>연간 누적 YTD</TableHead>
                   </TableRow>
                   <TableRow className="text-sm text-muted-foreground hover:bg-slate-100/50">
                      <TableHead className="text-center border-r">구분</TableHead>
                      <React.Fragment>
                              <TableHead className="text-center min-w-[60px] bg-blue-50">전년</TableHead>
                              <TableHead className="text-center min-w-[50px] bg-blue-50">(%)</TableHead>
                              <TableHead className="text-center font-bold min-w-[60px] bg-blue-50">당년</TableHead>
                              <TableHead className="text-center min-w-[50px] bg-blue-50">(%)</TableHead>
                              <TableHead className="text-center min-w-[60px] bg-blue-50">전년비</TableHead>
                              <TableHead className="text-center min-w-[50px] bg-blue-50">YOY</TableHead>
                          </React.Fragment>
                      <TableHead className="text-center w-2 bg-white"></TableHead>
                      <TableHead className="text-center border-r">구분</TableHead>
                      <React.Fragment>
                              <TableHead className="text-center min-w-[60px] bg-purple-50">전년</TableHead>
                              <TableHead className="text-center min-w-[50px] bg-purple-50">(%)</TableHead>
                              <TableHead className="text-center font-bold min-w-[60px] bg-purple-50">당년</TableHead>
                              <TableHead className="text-center min-w-[50px] bg-purple-50">(%)</TableHead>
                              <TableHead className="text-center min-w-[60px] bg-purple-50">전년비</TableHead>
                              <TableHead className="text-center min-w-[50px] bg-purple-50">YOY</TableHead>
                          </React.Fragment>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {(pnlDataFromCSV || pnlData).map((row, index) => {
                     // 생산원가 행의 경우 m_prev, m_curr, y_prev, y_curr에 소수점 1자리 포맷 적용
                     const isProductionCost = row.label === "생산원가";
                     const formatValue = (val: string) => {
                       if (isProductionCost && val && val.includes('%')) {
                         return formatPercentGlobal(val);
                       }
                       return val;
                     };
                     
                     // 백분율 값을 소수점 첫째 자리로 포맷팅하는 함수
                     const formatPercentToOneDecimal = (val: string) => {
                       if (!val || val === '' || val === '-') return val || '-';
                       // 퍼센트 기호 제거 후 숫자 추출
                       const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
                       if (isNaN(num)) return val;
                       // 소수점 첫째 자리로 포맷팅
                       return `${num.toFixed(1)}%`;
                     };
                     
                     const isDiscountRate = row.label === "할인율";
                     const isSalesRevenue = row.label === "실판매출";
                     
                     // 툴팁 텍스트 결정
                     let tooltipText: string | undefined = undefined;
                     if (isDiscountRate) {
                       tooltipText = "라이선스 제외 매출채널의 실 할인율";
                     } else if (isSalesRevenue) {
                       tooltipText = "라이선스 제외 매출채널의 실판매출";
                     }
                     
                     return (
                       <TableRow key={index} className="hover:bg-slate-50/80">
                         <TableCell className="font-medium text-sm text-center border-r">{row.label}</TableCell>
                         <TableCell className="text-center text-sm bg-blue-50">{formatValue(row.m_prev)}</TableCell>
                         <TableCell className="text-center text-sm text-gray-500 bg-blue-50">{formatPercentToOneDecimal(row.m_prev_p)}</TableCell>
                         <TableCell className="text-center text-sm font-bold bg-blue-50">{formatValue(row.m_curr)}</TableCell>
                         {tooltipText ? (
                           <TableCell className="text-center text-sm text-gray-500 bg-blue-50 overflow-visible">
                             <SimpleTooltip text={tooltipText}>
                               <span className="cursor-help underline decoration-dotted underline-offset-2">
                                 {formatPercentToOneDecimal(row.m_curr_p)}
                               </span>
                             </SimpleTooltip>
                           </TableCell>
                         ) : (
                           <TableCell className="text-center text-sm text-gray-500 bg-blue-50">
                             {formatPercentToOneDecimal(row.m_curr_p)}
                           </TableCell>
                         )}
                         <TableCellStyled type="diff" className="text-center text-sm bg-blue-50">{row.m_diff}</TableCellStyled>
                        <TableCellStyled type="yoy" className="text-center text-sm bg-blue-50">{row.m_yoy}</TableCellStyled>
                        <TableCell className="text-center text-sm w-2 bg-white"></TableCell>
                        <TableCell className="font-medium text-sm text-center border-r">{row.label}</TableCell>
                        <TableCell className="text-center text-sm bg-purple-50">{formatValue(row.y_prev)}</TableCell>
                         <TableCell className="text-center text-sm text-gray-500 bg-purple-50">{formatPercentToOneDecimal(row.y_prev_p)}</TableCell>
                         <TableCell className="text-center text-sm font-bold bg-purple-50">{formatValue(row.y_curr)}</TableCell>
                         {tooltipText ? (
                           <TableCell className="text-center text-sm text-gray-500 bg-purple-50 overflow-visible">
                             <SimpleTooltip text={tooltipText}>
                               <span className="cursor-help underline decoration-dotted underline-offset-2">
                                 {formatPercentToOneDecimal(row.y_curr_p)}
                               </span>
                             </SimpleTooltip>
                           </TableCell>
                         ) : (
                           <TableCell className="text-center text-sm text-gray-500 bg-purple-50">
                             {formatPercentToOneDecimal(row.y_curr_p)}
                           </TableCell>
                         )}
                         <TableCellStyled type="diff" className="text-center text-sm bg-purple-50">{row.y_diff}</TableCellStyled>
                         <TableCellStyled type="yoy" className="text-center text-sm bg-purple-50">{row.y_yoy}</TableCellStyled>
                       </TableRow>
                     );
                   })}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>
        </div>

        {/* Detailed Interactive Charts Section (3 Columns) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* 1. Channel Sales Trend */}
            <InteractiveChartSection 
                title="2025-26년 월별 채널별 매출 추세"
                unit="K $"
                iconColor="bg-green-500"
                filterOptions={["US홀세일", "US EC", "EU EC", "라이선스"]}
                insights={[
                    {color: "purple", title: "주요 인사이트", content: "• 12월 총매출 $3,535K (YOY 155%), 역대 최고 실적 달성\n• US EC $3,327K (94%), 11월 대비 17% 추가 성장\n• 연평균 US EC $1,625K, 하반기 급성장세"},
                    {color: "blue", title: "채널 트렌드", content: "• US EC: 연말 특수로 폭발적 성장 (YOY 170%)\n• 라이선스: 하반기 회복세 지속 ($121K, YOY 107%)\n• EU EC: 반등 신호 ($70K, YOY 40%)\n• US홀세일: 연중 최저 수준 ($17K, 비중 0.5%)"},
                    {color: "green", title: "전략 포인트", content: "• US EC 의존도 94% → 채널 다변화 시급\n• EU EC 반등 모멘텀 활용, 26년 확대 전략 수립\n• US홀세일 재편 또는 단계적 철수 검토\n• 라이선스 파트너십 강화로 안정적 수익원 확보"}
                ]}
                csvChartData={chartDataForComponents?.channelSales}
                chartType="channel"
            />
            
            {/* 2. Item Sales Trend */}
            <InteractiveChartSection 
                title="2025-26년 월별 아이템별 매출 추세"
                unit="K $"
                iconColor="bg-orange-500"
                filterOptions={["25FW", "25SS", "FW과시즌", "SS과시즌", "CORE"]}
                insights={[
                    {color: "purple", title: "시즌 트렌드", content: "• 25FW: 12월 $1,690K로 전체 50% 차지, 시즌 피크 도달\n• 25SS: $800K로 시즌 마무리 단계 (YOY 869%)\n• CORE: $711K로 급성장 (YOY 266%), 연말 수요 폭발"},
                    {color: "blue", title: "카테고리", content: "• 25FW 시즌 정점 (비중 50%)\n• CORE 연말 특수 (비중 21%)\n• 25SS 시즌 종료 (비중 23%)\n• 과시즌 소진 완료 단계 (비중 6%)"},
                    {color: "green", title: "핵심액션", content: "• 26SS 신상품 준비 및 출시 타이밍 최적화\n• 25FW 재고 소진 전략 수립 (할인율 관리)\n• CORE 라인업 강화로 안정적 매출 기반 확보"}
                ]}
                csvChartData={chartDataForComponents?.itemSales}
                chartType="item"
            />

            {/* 3. Inventory Trend */}
            <InteractiveChartSection 
                title="2025-26년 월별 아이템별 재고 추세"
                unit="K $"
                iconColor="bg-purple-500"
                filterOptions={["25FW", "25SS", "FW과시즌", "SS과시즌", "CORE"]}
                insights={[
                    {color: "purple", title: "조기경보", content: "• 총재고 $23,133K로 대폭 감소 (YOY 183%)\n• 25FW: $13,830K (비중 60%), 26년 초 소진 집중 필요\n• 25SS: $6,770K (비중 29%), 시즌 종료 임박"},
                    {color: "blue", title: "긍정신호", content: "• 11월 대비 재고 25% 감소: $31,076K → $23,133K\n• 25SS 소진 가속: $9,610K → $6,770K (30% 감소)\n• FW과시즌 지속 감소: $1,831K → $1,221K\n• CORE 재고 정상화: $2,113K → $1,033K (51% 감소)"},
                    {color: "green", title: "인사이트", content: "• 연말 세일 효과로 재고 건전성 개선\n• 25FW 재고 비중 60%, 26년 1Q 소진 전략 필요\n• 과시즌 재고 거의 정리 완료 ($1,498K)\n• 26SS 신규 입고 준비 단계 진입"}
                ]}
                csvChartData={chartDataForComponents?.inventory}
                chartType="inventory"
            />
        </div>

        {/* 직접비 요약 */}
        {directExpenseSummaryData ? (
          <ExpenseSummarySection
              title="직접비 요약"
              iconColor="bg-purple-500"
              defaultPeriod="당월"
              cards={directExpenseSummaryData}
              semPopupData={popupData?.semAd}
              shippingPopupData={popupData?.shippingCost}
          />
        ) : (
          <ExpenseSummarySection
              title="직접비 요약"
              iconColor="bg-purple-500"
              defaultPeriod="당월"
              cards={[]}
          />
        )}

        {/* 영업비 요약 */}
        {operatingExpenseSummaryData ? (
          <ExpenseSummarySection
              title="영업비 요약"
              iconColor="bg-orange-500"
              defaultPeriod="당월"
              cards={operatingExpenseSummaryData}
              semPopupData={popupData?.semAd}
          />
        ) : (
          <ExpenseSummarySection
              title="영업비 요약"
              iconColor="bg-orange-500"
              defaultPeriod="당월"
              cards={[]}
          />
        )}
          </>
        )}
      </main>
    </div>
  )
}
