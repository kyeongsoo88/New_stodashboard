import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

import { useEffect } from "react"

interface MetricCardProps {
  title: string
  value: string
  subValue?: string // e.g. "YoY 104%"
  subValueColor?: "text-green-500" | "text-green-600" | "text-red-500" | "text-blue-500" | "text-gray-500"
  description?: string // e.g. "(시코포함 100%)"
  trend?: "up" | "down" | "neutral"
  trendValue?: string // e.g. "4.5%p"
  className?: string
  children?: React.ReactNode
  itemDetails?: { name: string; value: string; share?: string; rate: string; isTotal?: boolean }[]
  topStoresDetails?: { name: string; value: string; yoy: string }[]
  statsDetails?: { name: string; value: string; yoy: string }[]
  detailsTitle?: string
  expandAll?: boolean
}

export function MetricCard({
  title,
  value,
  subValue,
  subValueColor = "text-gray-500",
  description,
  trend,
  trendValue,
  className,
  children,
  itemDetails,
  topStoresDetails,
  statsDetails,
  detailsTitle,
  expandAll
}: MetricCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (expandAll !== undefined) {
      setIsExpanded(expandAll)
    }
  }, [expandAll])

  return (
    <Card className={cn("overflow-hidden shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0">
        <CardTitle className="text-base font-bold text-black mb-0 leading-tight">
          {title}
        </CardTitle>
        {trend === "up" && <ArrowUpIcon className="h-4 w-4 text-red-500" />}
        {trend === "down" && <ArrowDownIcon className="h-4 w-4 text-blue-500" />}
        {trend === "neutral" && <MinusIcon className="h-4 w-4 text-gray-500" />}
      </CardHeader>
      <CardContent className="pt-0 -mt-1">
        <div className="text-2xl font-bold -mt-1 leading-tight">{value}</div>
        {(subValue || description) && (
          <div className="flex items-center space-x-2 text-xs">
            {subValue && (
              <span className={cn("font-bold", subValueColor)}>
                {subValue}
              </span>
            )}
            {description && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </div>
        )}
        
        {itemDetails && (
          <div className="mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[11px] px-0 w-full justify-between hover:bg-transparent"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="font-bold text-blue-700">아이템별 상세보기</span>
              {isExpanded ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
            </Button>
            
            {isExpanded && (
              <div className="border-t pt-2 space-y-1 text-xs">
                <div className="flex justify-between items-center text-[11px] text-gray-500 mb-1 pb-1 border-b border-dashed">
                  <span>아이템별</span>
                  <div className="flex items-center gap-0.5">
                    <span className="w-[60px] min-w-[60px] text-right whitespace-nowrap">발주(TAG)</span>
                    <span className="w-[4px] text-center">|</span>
                    <span className="w-[60px] min-w-[60px] text-right whitespace-nowrap">발주YoY</span>
                    <span className="w-[4px] text-center">|</span>
                    <span className="w-[60px] min-w-[60px] text-right whitespace-nowrap">당년 판매율</span>
                  </div>
                </div>
                {itemDetails.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex justify-between items-center py-0.5",
                      item.isTotal ? "font-bold border-t border-gray-200 mt-1 pt-1" : ""
                    )}
                  >
                    <span className="text-[11px]">{item.name}</span>
                    <div className="flex items-center gap-0.5 text-[11px]">
                      <span className="w-[60px] min-w-[60px] text-right font-medium tabular-nums">{item.value}</span>
                      <span className="w-[4px] text-center text-gray-300">|</span>
                      <span className="w-[60px] min-w-[60px] text-right font-medium tabular-nums">{item.share}</span>
                      <span className="w-[4px] text-center text-gray-300">|</span>
                      <span className="w-[60px] min-w-[60px] text-right text-blue-600 font-medium tabular-nums">{item.rate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {topStoresDetails && (
          <div className="mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[11px] px-0 w-full justify-between hover:bg-transparent"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span className="font-bold text-blue-700">{detailsTitle || "아이템별 TOP 5(TAG 발주액 기준)"}</span>
              {isExpanded ? <ChevronUpIcon className="h-3 w-3" /> : <ChevronDownIcon className="h-3 w-3" />}
            </Button>
            
            {isExpanded && (
              <div className="border-t pt-2 space-y-1 text-xs">
                {topStoresDetails.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-0.5">
                    <span className="text-[11px] min-w-[60px]">{item.name}</span>
                    <div className="flex items-center gap-1.5 justify-end" style={{ minWidth: '120px' }}>
                      <span className="font-bold text-[11px] w-[60px] text-right tabular-nums">{item.value}</span>
                      <span className="text-[11px] text-gray-500 min-w-[60px] text-right">{item.yoy}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {statsDetails && (
          <div className="mt-3 space-y-1 text-xs">
            {statsDetails.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-[11px] text-gray-600">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[11px] text-gray-900 tabular-nums">{item.value}</span>
                  <span className="text-[11px] px-1 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold min-w-[45px] text-center">{item.yoy}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  )
}

