import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronDown,
  CircleX,
  Download,
  Edit,
  Filter,
  LogOut,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Trash2,
  User,
  AlertTriangle,
  Info,
  Loader2,
  Home,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
} from "lucide-react";

// shadcn/ui components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function KitchenSinkDemo() {
  const [progress, setProgress] = useState(36);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header with custom styling */}
        <header className="sticky top-0 z-50 border-b border-border bg-primary text-white">
          <div className="container flex h-16 items-center px-4 lg:px-6">
            <Breadcrumb className="flex-1 min-w-0">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-white/80 hover:text-white">
                    <span className="hidden sm:inline">Home</span>
                    <span className="sm:hidden">H</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-white/60" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-white truncate">
                    <span className="hidden sm:inline">UI Components</span>
                    <span className="sm:hidden">Components</span>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Search icon for mobile, full search for desktop */}
              <Button
                variant="ghost" 
                size="icon"
                className="lg:hidden h-12 w-12 min-h-[48px] text-white hover:bg-white/10"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                className="hidden lg:flex justify-between w-64 h-12 min-h-[48px] border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setCommandOpen(true)}
              >
                <span className="text-white/80">Search components...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/30 bg-white/20 px-1.5 font-mono text-[10px] font-medium text-white/80">
                  ⌘K
                </kbd>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-12 w-12 min-h-[48px] text-white hover:bg-white/10">
                    <Bell className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              {/* Mobile: Bottom Sheet */}
              <div className="md:hidden">
                <Button 
                  variant="ghost" 
                  className="gap-2 h-12 min-h-[48px] px-3 text-white hover:bg-white/10"
                  onClick={() => setProfileSheetOpen(true)}
                >
                  <Avatar className="h-6 w-6">
                    <AvatarImage src="https://i.pravatar.cc/64" alt="User" />
                    <AvatarFallback>UM</AvatarFallback>
                  </Avatar>
                </Button>
              </div>

              {/* Desktop: Dropdown Menu */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 h-12 min-h-[48px] px-3 sm:px-4 text-white hover:bg-white/10">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="https://i.pravatar.cc/64" alt="User" />
                        <AvatarFallback>UM</AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:inline">Uriel</span>
                      <ChevronDown className="h-4 w-4 hidden lg:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 shadow-lg border-2 bg-white border-border">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-white">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main content with responsive layout */}
        <main className="w-full px-3 sm:px-4 py-4 sm:py-6 lg:px-6">
          <div className="flex justify-center w-full">
            <div className="w-full max-w-3xl mx-auto">
              <div className="space-y-4 sm:space-y-6">
              
              {/* Typography Section */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>Headings, text, links, and content hierarchy</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  {/* Headings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Headings</h4>
                    <div className="space-y-3">
                      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
                      <h2 className="scroll-m-20 text-3xl font-semibold tracking-tight">Heading 2</h2>
                      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Heading 3</h3>
                      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Heading 4</h4>
                      <h5 className="scroll-m-20 text-lg font-semibold tracking-tight">Heading 5</h5>
                      <h6 className="scroll-m-20 text-base font-semibold tracking-tight">Heading 6</h6>
                    </div>
                  </div>

                  <Separator />

                  {/* Text and Links */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Text & Links</h4>
                    <div className="space-y-3">
                      <p className="leading-7">
                        This is a paragraph with <a href="#" className="text-primary underline underline-offset-4 hover:text-primary-hover">default link</a>, 
                        and a <a href="#" className="text-primary underline underline-offset-4 hover:text-primary-hover visited:text-purple-600">visited link</a>. 
                        Links support hover, focus, and active states.
                      </p>
                      <p className="text-sm text-muted-foreground">
                        This is muted text, often used for descriptions or secondary information.
                      </p>
                      <p className="text-lg font-semibold">
                        This is emphasized text for callouts or important information.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Lists */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Lists</h4>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Unordered List</h5>
                        <ul className="space-y-1 list-disc list-inside">
                          <li>First item</li>
                          <li>Second item</li>
                          <li>
                            Nested item
                            <ul className="mt-1 ml-4 space-y-1 list-disc list-inside">
                              <li>Nested sub-item</li>
                              <li>Another nested item</li>
                            </ul>
                          </li>
                          <li>Last item</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-2">Ordered List</h5>
                        <ol className="space-y-1 list-decimal list-inside">
                          <li>First step</li>
                          <li>Second step</li>
                          <li>
                            Complex step
                            <ol className="mt-1 ml-4 space-y-1 list-decimal list-inside">
                              <li>Sub-step A</li>
                              <li>Sub-step B</li>
                            </ol>
                          </li>
                          <li>Final step</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Forms Section */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Form Components</CardTitle>
                  <CardDescription>Input fields, validation states, and form controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="text-input">Text Input</Label>
                      <Input 
                        id="text-input" 
                        type="text" 
                        placeholder="Enter text"
                        className="h-12 min-h-[48px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email"
                        className="h-12 min-h-[48px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="Enter password"
                        className="h-12 min-h-[48px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <Input 
                        id="search" 
                        type="search" 
                        placeholder="Search..."
                        className="h-12 min-h-[48px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="number">Number</Label>
                      <Input 
                        id="number" 
                        type="number" 
                        placeholder="Enter number"
                        className="h-12 min-h-[48px]"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file">File Upload</Label>
                      <Input 
                        id="file" 
                        type="file" 
                        className="h-12 min-h-[48px]"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email-error">Input (Error State)</Label>
                      <Input 
                        id="email-error" 
                        type="email" 
                        placeholder="invalid@email"
                        className="h-11 border-destructive focus-visible:ring-destructive"
                        defaultValue="invalid-email"
                      />
                      <p className="text-sm text-destructive">Please enter a valid email address.</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="disabled-input">Disabled Input</Label>
                      <Input 
                        id="disabled-input" 
                        type="text" 
                        placeholder="Disabled input"
                        className="h-12 min-h-[48px]"
                        disabled
                        defaultValue="Cannot edit this"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select>
                        <SelectTrigger id="role" className="h-11">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-border">
                          <SelectItem value="dev" className="focus:bg-[var(--primary-hover)] focus:text-white data-[state=checked]:bg-primary data-[state=checked]:text-white">Developer</SelectItem>
                          <SelectItem value="designer" className="focus:bg-[var(--primary-hover)] focus:text-white">Designer</SelectItem>
                          <SelectItem value="pm" className="focus:bg-[var(--primary-hover)] focus:text-white">Product Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role-disabled">Role (Disabled)</Label>
                      <Select disabled>
                        <SelectTrigger id="role-disabled" className="h-11">
                          <SelectValue placeholder="Disabled select" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-border">
                          <SelectItem value="dev" className="focus:bg-[var(--primary-hover)] focus:text-white data-[state=checked]:bg-primary data-[state=checked]:text-white">Developer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea 
                        id="bio" 
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Form Controls */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Form Controls</h4>
                    <div className="grid gap-6 sm:grid-cols-2">
                      {/* Checkboxes */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-muted-foreground">Checkboxes</h5>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="terms" className="h-5 w-5" />
                          <Label htmlFor="terms" className="text-sm font-normal">Unchecked</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="marketing" defaultChecked className="h-5 w-5" />
                          <Label htmlFor="marketing" className="text-sm font-normal">Checked</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="indeterminate" className="h-5 w-5" defaultChecked={false} />
                          <Label htmlFor="indeterminate" className="text-sm font-normal">Indeterminate</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="disabled-unchecked" disabled className="h-5 w-5" />
                          <Label htmlFor="disabled-unchecked" className="text-sm font-normal">Disabled unchecked</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="disabled-checked" disabled defaultChecked className="h-5 w-5" />
                          <Label htmlFor="disabled-checked" className="text-sm font-normal">Disabled checked</Label>
                        </div>
                      </div>

                      {/* Radio Buttons */}
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-muted-foreground">Radio Buttons</h5>
                        <RadioGroup defaultValue="medium">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="low" id="r1" className="h-5 w-5" />
                            <Label htmlFor="r1" className="text-sm font-normal">Low priority</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="medium" id="r2" className="h-5 w-5" />
                            <Label htmlFor="r2" className="text-sm font-normal">Medium priority (selected)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="high" id="r3" className="h-5 w-5" />
                            <Label htmlFor="r3" className="text-sm font-normal">High priority</Label>
                          </div>
                        </RadioGroup>

                        <RadioGroup disabled defaultValue="disabled-option">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="disabled-option" id="r4" className="h-5 w-5" />
                            <Label htmlFor="r4" className="text-sm font-normal">Disabled (selected)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="disabled-other" id="r5" className="h-5 w-5" />
                            <Label htmlFor="r5" className="text-sm font-normal">Disabled option</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    {/* Switches */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">Switches/Toggles</h5>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifications-on" className="text-sm font-medium">Email notifications (On)</Label>
                          <div className="text-sm text-muted-foreground">Receive email updates about your account</div>
                        </div>
                        <Switch id="notifications-on" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifications-off" className="text-sm font-medium">Marketing emails (Off)</Label>
                          <div className="text-sm text-muted-foreground">Receive promotional content</div>
                        </div>
                        <Switch id="notifications-off" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notifications-disabled" className="text-sm font-medium">Disabled switch</Label>
                          <div className="text-sm text-muted-foreground">Cannot be toggled</div>
                        </div>
                        <Switch id="notifications-disabled" disabled />
                      </div>
                    </div>

                    {/* Range Slider */}
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">Range Slider</h5>
                      <div className="space-y-2">
                        <Label>Volume (33%)</Label>
                        <Slider defaultValue={[33]} max={100} step={1} className="w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Range Slider (25% - 75%)</Label>
                        <Slider defaultValue={[25, 75]} max={100} step={1} className="w-full" />
                      </div>
                      <div className="space-y-2">
                        <Label>Disabled Slider</Label>
                        <Slider defaultValue={[50]} max={100} step={1} className="w-full" disabled />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Button States and Actions */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Buttons</CardTitle>
                  <CardDescription>All button variants, sizes, and interactive states</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  {/* Variants */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Variants</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-11 min-w-[44px]">Primary</Button>
                      <Button variant="secondary" className="h-11 min-w-[44px]">Secondary</Button>
                      <Button variant="outline" className="h-11 min-w-[44px]">Outline</Button>
                      <Button variant="ghost" className="h-11 min-w-[44px]">Ghost</Button>
                      <Button variant="link" className="h-11 min-w-[44px]">Link</Button>
                      <Button variant="destructive" className="h-11 min-w-[44px]">Destructive</Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Sizes */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Sizes</h4>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" className="min-w-[44px]">Small</Button>
                      <Button size="default" className="min-w-[44px]">Default</Button>
                      <Button size="lg" className="min-w-[44px]">Large</Button>
                      <Button size="icon" className="w-10 h-10">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* States */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">States</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-11 min-w-[44px]">Default</Button>
                      <Button className="h-11 min-w-[44px] hover:bg-primary-hover" onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}>Hover</Button>
                      <Button className="h-11 min-w-[44px] focus:ring-2 focus:ring-ring focus:ring-offset-2">Focus</Button>
                      <Button className="h-11 min-w-[44px] active:scale-95">Active</Button>
                      <Button disabled className="h-11 min-w-[44px]">
                        Disabled
                      </Button>
                      <Button 
                        onClick={handleLoadingDemo}
                        disabled={isLoading}
                        className="h-11 w-24"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Loading"
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Icon Combinations */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">With Icons</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-11">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                      <Button variant="outline" className="h-11">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" className="h-11">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Progress Example</Label>
                        <span className="text-sm text-muted-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setProgress(p => Math.min(100, p + 10))}
                        className="h-12 min-h-[48px]"
                        size="sm"
                      >
                        +10
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setProgress(p => Math.max(0, p - 10))}
                        className="h-12 min-h-[48px]"
                        size="sm"
                      >
                        -10
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setProgress(0)}
                        className="h-12 min-h-[48px]"
                        size="sm"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Navigation Components */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Navigation Components</CardTitle>
                  <CardDescription>Navigation bars, breadcrumbs, tabs, and menu controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  {/* Top Navigation Bar */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Top Navigation Bar</h4>
                    <div className="border rounded-lg bg-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Button variant="ghost" size="icon" className="md:hidden">
                            <Menu className="h-4 w-4" />
                          </Button>
                          <div className="hidden md:flex items-center space-x-6">
                            <a href="#" className="text-sm font-medium text-foreground hover:text-primary">Dashboard</a>
                            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Projects</a>
                            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Team</a>
                            <a href="#" className="text-sm text-muted-foreground hover:text-primary">Settings</a>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Search className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Bell className="h-4 w-4" />
                          </Button>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Side Navigation */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Side Navigation</h4>
                    <div className="border rounded-lg bg-white p-4 w-full max-w-sm">
                      <nav className="space-y-1">
                        <a href="#" className="flex items-center space-x-3 bg-primary/10 text-primary rounded-md px-3 py-2 text-sm font-medium">
                          <Home className="h-4 w-4" />
                          <span>Dashboard</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-2 text-sm font-medium">
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md px-3 py-2 text-sm font-medium">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </a>
                        <a href="#" className="flex items-center space-x-3 text-muted-foreground/50 cursor-not-allowed rounded-md px-3 py-2 text-sm font-medium">
                          <Filter className="h-4 w-4" />
                          <span>Analytics (Disabled)</span>
                        </a>
                      </nav>
                    </div>
                  </div>

                  <Separator />

                  {/* Breadcrumbs */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Breadcrumbs</h4>
                    <div className="space-y-2">
                      <Breadcrumb>
                        <BreadcrumbList>
                          <BreadcrumbItem>
                            <BreadcrumbLink href="#" className="hover:text-primary">
                              Home
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbLink href="#" className="hover:text-primary">
                              Components
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbPage>Kitchen Sink</BreadcrumbPage>
                          </BreadcrumbItem>
                        </BreadcrumbList>
                      </Breadcrumb>

                      <Breadcrumb>
                        <BreadcrumbList>
                          <BreadcrumbItem>
                            <BreadcrumbLink href="#" className="hover:text-primary">
                              Dashboard
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbLink href="#" className="hover:text-primary">
                              Projects
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbLink href="#" className="hover:text-primary">
                              Frontend
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbPage>Settings</BreadcrumbPage>
                          </BreadcrumbItem>
                        </BreadcrumbList>
                      </Breadcrumb>
                    </div>
                  </div>

                  <Separator />

                  {/* Tabs */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Tabs</h4>
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                        <TabsTrigger value="notifications" disabled>Notifications</TabsTrigger>
                      </TabsList>
                      <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <h4 className="font-medium mb-2">Overview Tab</h4>
                          <p className="text-sm text-muted-foreground">This is the overview tab content with some sample information.</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="analytics" className="space-y-4 mt-4">
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <h4 className="font-medium mb-2">Analytics Tab</h4>
                          <p className="text-sm text-muted-foreground">Analytics content would go here with charts and metrics.</p>
                        </div>
                      </TabsContent>
                      <TabsContent value="reports" className="space-y-4 mt-4">
                        <div className="p-4 border rounded-lg bg-muted/30">
                          <h4 className="font-medium mb-2">Reports Tab</h4>
                          <p className="text-sm text-muted-foreground">Reports and data exports would be available in this section.</p>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>

                  <Separator />

                  {/* Pagination */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Pagination Controls</h4>
                    <div className="space-y-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious href="#" />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#" isActive>1</PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#">2</PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#">3</PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationEllipsis />
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#">8</PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#">9</PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationLink href="#">10</PaginationLink>
                          </PaginationItem>
                          <PaginationItem>
                            <PaginationNext href="#" />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>

                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Showing 1-10 of 97 results</span>
                        <div className="flex items-center space-x-2">
                          <span>Rows per page:</span>
                          <Select>
                            <SelectTrigger className="w-16 h-8">
                              <SelectValue placeholder="10" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-border">
                              <SelectItem value="5" className="focus:bg-[var(--primary-hover)] focus:text-white">5</SelectItem>
                              <SelectItem value="10" className="focus:bg-[var(--primary-hover)] focus:text-white">10</SelectItem>
                              <SelectItem value="20" className="focus:bg-[var(--primary-hover)] focus:text-white">20</SelectItem>
                              <SelectItem value="50" className="focus:bg-[var(--primary-hover)] focus:text-white">50</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Dropdown Menus */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Dropdown Menus</h4>
                    <div className="flex flex-wrap gap-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">
                            Desktop Menu
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-white border-border">
                          <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">
                            <Home className="mr-2 h-4 w-4" />
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">
                            <User className="mr-2 h-4 w-4" />
                            Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 bg-white border-border">
                          <DropdownMenuLabel>Mobile Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-white">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback & Alerts */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Feedback & Alerts</CardTitle>
                  <CardDescription>Alerts, progress indicators, and user feedback components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  {/* Inline Alerts */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Inline Alerts</h4>
                    <div className="space-y-3">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Info</AlertTitle>
                        <AlertDescription>
                          This is an informational alert message with additional context.
                        </AlertDescription>
                      </Alert>
                      
                      <Alert className="border-green-200 bg-green-50 text-green-800">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Success</AlertTitle>
                        <AlertDescription className="text-green-700">
                          Your changes have been saved successfully.
                        </AlertDescription>
                      </Alert>

                      <Alert className="border-yellow-200 bg-yellow-50 text-yellow-800">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertTitle className="text-yellow-800">Warning</AlertTitle>
                        <AlertDescription className="text-yellow-700">
                          This action cannot be undone. Please proceed with caution.
                        </AlertDescription>
                      </Alert>
                      
                      <Alert variant="destructive">
                        <CircleX className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          Your session has expired. Please log in again to continue.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>

                  <Separator />

                  {/* Progress Bars */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Progress Bars</h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Determinate Progress (36%)</Label>
                          <span className="text-sm text-muted-foreground">36/100</span>
                        </div>
                        <Progress value={36} className="w-full" />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>High Progress (85%)</Label>
                          <span className="text-sm text-muted-foreground">85/100</span>
                        </div>
                        <Progress value={85} className="w-full" />
                      </div>

                      <div className="space-y-2">
                        <Label>Indeterminate Progress</Label>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full animate-pulse w-1/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Skeleton Loaders */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Skeleton Loaders</h4>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Card Skeleton</h5>
                        <div className="border rounded-lg p-4 space-y-3">
                          <Skeleton className="h-4 w-1/4" />
                          <div className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-5/6" />
                            <Skeleton className="h-3 w-4/6" />
                          </div>
                          <div className="flex space-x-2">
                            <Skeleton className="h-8 w-20" />
                            <Skeleton className="h-8 w-20" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Empty States */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Empty State Cards</h4>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                        <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                          <Search className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-2">No results found</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          We couldn't find anything matching your search. Try adjusting your filters.
                        </p>
                        <Button variant="outline" size="sm">
                          Clear filters
                        </Button>
                      </div>

                      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                        <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                          <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium mb-2">Create your first project</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Get started by creating a new project for your team.
                        </p>
                        <Button size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          New Project
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Toast Notifications */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Toast Notifications</h4>
                    <div className="space-y-3">
                      <div className="bg-white border shadow-lg rounded-lg p-4 max-w-sm">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Successfully saved!</p>
                            <p className="text-sm text-gray-500 mt-1">Your changes have been saved.</p>
                          </div>
                          <div className="ml-auto pl-3">
                            <Button variant="ghost" size="icon" className="h-5 w-5">
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border shadow-lg rounded-lg p-4 max-w-sm">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Warning</p>
                            <p className="text-sm text-gray-500 mt-1">Please check your internet connection.</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border shadow-lg rounded-lg p-4 max-w-sm">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <CircleX className="h-5 w-5 text-red-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">Error occurred</p>
                            <p className="text-sm text-gray-500 mt-1">Failed to save changes. Please try again.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Complex Layout & Content */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Complex Layout & Content</CardTitle>
                  <CardDescription>Cards, tables, accordions, and advanced layout components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  {/* Cards Variants */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Card Variants</h4>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                      {/* Basic Card */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Basic Card</CardTitle>
                          <CardDescription>Simple card with header and content</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">This is a basic card with some content.</p>
                        </CardContent>
                      </Card>

                      {/* Card with Image */}
                      <Card className="overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">Image Header</span>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg">Card with Image</CardTitle>
                          <CardDescription>Card featuring an image header</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">Content below the image header.</p>
                        </CardContent>
                      </Card>

                      {/* Card with Actions */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Card with Actions</CardTitle>
                          <CardDescription>Interactive card with action buttons</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">This card includes action buttons in the footer.</p>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline">Cancel</Button>
                          <Button>Save</Button>
                        </CardFooter>
                      </Card>

                      {/* Card with Badge */}
                      <Card>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">Status Card</CardTitle>
                              <CardDescription>Card with status badges</CardDescription>
                            </div>
                            <Badge variant="secondary">Active</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge>Pro</Badge>
                            <Badge variant="outline">Verified</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Multiple status indicators.</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Tables */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Tables</h4>
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="font-medium">John Doe</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-green-800 bg-green-100">Active</Badge>
                            </TableCell>
                            <TableCell>Administrator</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white border-border">
                                  <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">Edit</DropdownMenuItem>
                                  <DropdownMenuItem className="focus:bg-[var(--primary-hover)] focus:text-white">View</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-white">Delete</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Jane Smith</TableCell>
                            <TableCell>
                              <Badge variant="outline">Pending</Badge>
                            </TableCell>
                            <TableCell>Editor</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">Edit</Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="font-medium">Bob Johnson</TableCell>
                            <TableCell>
                              <Badge variant="destructive">Inactive</Badge>
                            </TableCell>
                            <TableCell>Viewer</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm">Activate</Button>
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <Separator />

                  {/* Accordions */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Accordions</h4>
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger>General Settings</AccordionTrigger>
                        <AccordionContent>
                          Configure basic application settings and preferences here.
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="setting1">Enable notifications</Label>
                              <Switch id="setting1" />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger>Security & Privacy</AccordionTrigger>
                        <AccordionContent>
                          Manage your security settings and privacy preferences.
                          <div className="mt-3 space-y-3">
                            <Button variant="outline" size="sm">Change Password</Button>
                            <div className="flex items-center justify-between">
                              <Label htmlFor="setting2">Two-factor authentication</Label>
                              <Switch id="setting2" defaultChecked />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger>Advanced Options</AccordionTrigger>
                        <AccordionContent>
                          Advanced configuration options for power users.
                          <div className="mt-3 space-y-2">
                            <div className="space-y-2">
                              <Label htmlFor="api-key">API Key</Label>
                              <Input id="api-key" type="password" placeholder="Enter API key" />
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <Separator />

                  {/* Tag Chips & Avatars */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Tags & Avatars</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Tag Chips / Badges</h5>
                        <div className="flex flex-wrap gap-2">
                          <Badge>Default</Badge>
                          <Badge variant="secondary">Secondary</Badge>
                          <Badge variant="outline">Outline</Badge>
                          <Badge variant="destructive">Destructive</Badge>
                          <Badge className="bg-blue-100 text-blue-800">Custom Blue</Badge>
                          <Badge className="bg-purple-100 text-purple-800">Custom Purple</Badge>
                          <Badge className="bg-orange-100 text-orange-800">Custom Orange</Badge>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Avatars</h5>
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="https://i.pravatar.cc/32" />
                            <AvatarFallback>JD</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src="https://i.pravatar.cc/40" />
                            <AvatarFallback>AB</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-12 w-12">
                            <AvatarImage src="https://i.pravatar.cc/48" />
                            <AvatarFallback>CD</AvatarFallback>
                          </Avatar>
                          <Avatar className="h-16 w-16">
                            <AvatarFallback>XL</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Media List</h5>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage src="https://i.pravatar.cc/40" />
                              <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">John Doe</p>
                              <p className="text-sm text-muted-foreground truncate">Software Engineer</p>
                            </div>
                            <Badge variant="secondary">Online</Badge>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback>JS</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">Jane Smith</p>
                              <p className="text-sm text-muted-foreground truncate">Product Designer</p>
                            </div>
                            <Badge variant="outline">Away</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date & Time Pickers */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Date & Time Pickers</CardTitle>
                  <CardDescription>Calendar, date range, and time selection components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  {/* Single Date Picker */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Single Date</h4>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Pick a date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-11",
                                !date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {date ? format(date, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 shadow-lg border-2 bg-white" align="start">
                            <Calendar
                              mode="single"
                              selected={date}
                              onSelect={setDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Date (disabled)</Label>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-11"
                          disabled
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Cannot select date
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Date Range Picker */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Date Range</h4>
                    <div className="space-y-2">
                      <Label>Select date range</Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal h-11"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Start date
                        </Button>
                        <Button
                          variant="outline"
                          className="justify-start text-left font-normal h-11"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          End date
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Time Picker */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Time Picker</h4>
                    <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="time">Select time</Label>
                        <Input 
                          id="time"
                          type="time" 
                          className="h-12 min-h-[48px]"
                          defaultValue="09:00"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="datetime">Date & Time</Label>
                        <Input 
                          id="datetime"
                          type="datetime-local" 
                          className="h-12 min-h-[48px]"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Calendar Preview */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Calendar Preview</h4>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border bg-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overlay Components */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Overlays</CardTitle>
                  <CardDescription>Modals, sheets, and dropdown menus</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full h-11">
                        Open Dialog
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white">
                      <DialogHeader>
                        <DialogTitle>Confirm Action</DialogTitle>
                        <DialogDescription>
                          This action will permanently delete your account. This cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive">Delete Account</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="w-full h-11">
                        Open Sheet
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="bg-white">
                      <SheetHeader>
                        <SheetTitle>Sheet Title</SheetTitle>
                        <SheetDescription>
                          This is a sheet component for side panels and drawers.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="py-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" placeholder="Enter your name" className="h-11" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="Enter your email" className="h-11" />
                          </div>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full h-11">
                        Dropdown Menu
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 shadow-lg border-2 bg-white border-border">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuCheckboxItem checked className="focus:bg-[var(--primary-hover)] focus:text-white data-[state=checked]:bg-primary data-[state=checked]:text-white">
                        Email notifications
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem className="focus:bg-[var(--primary-hover)] focus:text-white">
                        Push notifications
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuRadioGroup value="billing">
                        <DropdownMenuRadioItem value="billing" className="focus:bg-[var(--primary-hover)] focus:text-white data-[state=checked]:bg-primary data-[state=checked]:text-white">
                          Billing
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="team" className="focus:bg-[var(--primary-hover)] focus:text-white">
                          Team
                        </DropdownMenuRadioItem>
                      </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>

              {/* Avatar & Identity */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Avatar & Identity</CardTitle>
                  <CardDescription>User avatars, badges, and identity components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src="https://i.pravatar.cc/80" />
                      <AvatarFallback>JC</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <h4 className="font-medium">Jane Cooper</h4>
                      <p className="text-sm text-muted-foreground">Product Designer</p>
                      <div className="flex gap-2">
                        <Badge>Pro</Badge>
                        <Badge variant="secondary">Active</Badge>
                        <Badge variant="outline">Verified</Badge>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Badge Variants</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Navigation</h4>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious href="#" />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#">1</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#" isActive>
                            2
                          </PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationLink href="#">3</PaginationLink>
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                        <PaginationItem>
                          <PaginationNext href="#" />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                </CardContent>
              </Card>

              {/* Loading States */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Loading States</CardTitle>
                  <CardDescription>Skeleton placeholders and loading indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Text Skeletons</h4>
                    <div className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Profile Skeleton</h4>
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Theme & Utility Checks */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-4 lg:p-6">
                  <CardTitle>Theme & Utility Checks</CardTitle>
                  <CardDescription>Color swatches, spacing examples, and responsive breakpoint tests</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
                  {/* Color Swatches */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Color Swatches</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-3">Primary Colors</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-2">
                            <div className="h-16 bg-primary rounded-md border"></div>
                            <p className="text-xs text-center">Primary</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-16 rounded-md border" style={{backgroundColor: 'var(--primary-hover)'}}></div>
                            <p className="text-xs text-center">Primary Hover</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-16 bg-secondary rounded-md border"></div>
                            <p className="text-xs text-center">Secondary</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-16 bg-muted rounded-md border"></div>
                            <p className="text-xs text-center">Muted</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-3">Semantic Colors</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="space-y-2">
                            <div className="h-16 bg-green-500 rounded-md border"></div>
                            <p className="text-xs text-center">Success</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-16 bg-yellow-500 rounded-md border"></div>
                            <p className="text-xs text-center">Warning</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-16 bg-destructive rounded-md border"></div>
                            <p className="text-xs text-center">Error</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-16 bg-blue-500 rounded-md border"></div>
                            <p className="text-xs text-center">Info</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-3">Neutral Colors</h5>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          <div className="space-y-2">
                            <div className="h-12 bg-gray-50 rounded-md border"></div>
                            <p className="text-xs text-center">50</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-12 bg-gray-100 rounded-md border"></div>
                            <p className="text-xs text-center">100</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-12 bg-gray-200 rounded-md border"></div>
                            <p className="text-xs text-center">200</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-12 bg-gray-300 rounded-md border"></div>
                            <p className="text-xs text-center">300</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-12 bg-gray-400 rounded-md border"></div>
                            <p className="text-xs text-center">400</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-12 bg-gray-500 rounded-md border"></div>
                            <p className="text-xs text-center">500</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-12 bg-gray-600 rounded-md border"></div>
                            <p className="text-xs text-center">600</p>
                          </div>
                          <div className="space-y-2">
                            <div className="h-12 bg-gray-900 rounded-md border"></div>
                            <p className="text-xs text-center">900</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Spacing Examples */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Spacing Examples</h4>
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-3">Padding Examples</h5>
                        <div className="space-y-2">
                          <div className="bg-primary/10 border border-primary/20">
                            <div className="bg-primary/20 p-1">p-1 (4px)</div>
                          </div>
                          <div className="bg-primary/10 border border-primary/20">
                            <div className="bg-primary/20 p-2">p-2 (8px)</div>
                          </div>
                          <div className="bg-primary/10 border border-primary/20">
                            <div className="bg-primary/20 p-4">p-4 (16px)</div>
                          </div>
                          <div className="bg-primary/10 border border-primary/20">
                            <div className="bg-primary/20 p-6">p-6 (24px)</div>
                          </div>
                          <div className="bg-primary/10 border border-primary/20">
                            <div className="bg-primary/20 p-8">p-8 (32px)</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-muted-foreground mb-3">Gap Examples</h5>
                        <div className="space-y-3">
                          <div className="flex gap-1">
                            <div className="bg-primary h-8 w-16 rounded"></div>
                            <div className="bg-primary h-8 w-16 rounded"></div>
                            <span className="text-sm self-center">gap-1 (4px)</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="bg-primary h-8 w-16 rounded"></div>
                            <div className="bg-primary h-8 w-16 rounded"></div>
                            <span className="text-sm self-center">gap-2 (8px)</span>
                          </div>
                          <div className="flex gap-4">
                            <div className="bg-primary h-8 w-16 rounded"></div>
                            <div className="bg-primary h-8 w-16 rounded"></div>
                            <span className="text-sm self-center">gap-4 (16px)</span>
                          </div>
                          <div className="flex gap-6">
                            <div className="bg-primary h-8 w-16 rounded"></div>
                            <div className="bg-primary h-8 w-16 rounded"></div>
                            <span className="text-sm self-center">gap-6 (24px)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Responsive Breakpoints */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Responsive Breakpoints</h4>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-4">
                        <div className="block sm:hidden">
                          <Badge variant="secondary">Mobile (≤640px)</Badge>
                          <p className="text-sm mt-2">You're viewing on mobile breakpoint</p>
                        </div>
                        <div className="hidden sm:block md:hidden">
                          <Badge className="bg-blue-100 text-blue-800">Tablet (641-768px)</Badge>
                          <p className="text-sm mt-2">You're viewing on tablet breakpoint</p>
                        </div>
                        <div className="hidden md:block lg:hidden">
                          <Badge className="bg-purple-100 text-purple-800">Small Desktop (769-1024px)</Badge>
                          <p className="text-sm mt-2">You're viewing on small desktop breakpoint</p>
                        </div>
                        <div className="hidden lg:block xl:hidden">
                          <Badge className="bg-green-100 text-green-800">Desktop (1025-1280px)</Badge>
                          <p className="text-sm mt-2">You're viewing on desktop breakpoint</p>
                        </div>
                        <div className="hidden xl:block">
                          <Badge className="bg-orange-100 text-orange-800">Large Desktop (≥1280px)</Badge>
                          <p className="text-sm mt-2">You're viewing on large desktop breakpoint</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <p className="text-sm">Responsive card layout adjusts based on screen size</p>
                          </CardContent>
                        </Card>
                        <Card className="hidden md:block">
                          <CardContent className="p-4">
                            <p className="text-sm">Hidden on mobile</p>
                          </CardContent>
                        </Card>
                        <Card className="hidden lg:block">
                          <CardContent className="p-4">
                            <p className="text-sm">Hidden on tablet</p>
                          </CardContent>
                        </Card>
                        <Card className="hidden lg:block">
                          <CardContent className="p-4">
                            <p className="text-sm">Desktop only</p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
          </div>
        </main>

        {/* Sticky footer for mobile */}
        <footer className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur md:hidden">
          <div className="container flex h-16 items-center justify-between px-4">
            <Button variant="outline" className="h-11">Back</Button>
            <div className="text-sm text-muted-foreground">Demo</div>
            <Button className="h-11">
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </footer>

        {/* Mobile Profile Sheet */}
        <Sheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
          <SheetContent side="bottom" className="bg-white">
            <SheetHeader className="text-left pb-4">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src="https://i.pravatar.cc/64" alt="User" />
                  <AvatarFallback>UM</AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-lg">Uriel Maldonado</SheetTitle>
                  <SheetDescription className="text-sm text-muted-foreground">
                    uriel@example.com
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
            
            <div className="space-y-1 py-4">
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 text-base font-normal"
                onClick={() => setProfileSheetOpen(false)}
              >
                <User className="mr-3 h-5 w-5" />
                Profile
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 text-base font-normal"
                onClick={() => setProfileSheetOpen(false)}
              >
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </Button>
              
              <div className="border-t border-border my-2"></div>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start h-12 text-base font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => setProfileSheetOpen(false)}
              >
                <LogOut className="mr-3 h-5 w-5" />
                Log out
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Command Palette */}
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Components">
              <CommandItem>
                <Search className="mr-2 h-4 w-4" />
                <span>Button</span>
              </CommandItem>
              <CommandItem>
                <User className="mr-2 h-4 w-4" />
                <span>Avatar</span>
              </CommandItem>
              <CommandItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Form</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              <CommandItem>
                <Download className="mr-2 h-4 w-4" />
                <span>Export</span>
                <CommandShortcut>⌘E</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Plus className="mr-2 h-4 w-4" />
                <span>Create New</span>
                <CommandShortcut>⌘N</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </TooltipProvider>
  );
}