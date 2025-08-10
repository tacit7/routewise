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
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function KitchenSinkDemo() {
  const [progress, setProgress] = useState(36);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [open, setOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

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
                className="lg:hidden h-10 w-10 text-white hover:bg-white/10"
                onClick={() => setCommandOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                className="hidden lg:flex justify-between w-64 h-10 border-white/20 bg-white/10 text-white hover:bg-white/20"
                onClick={() => setCommandOpen(true)}
              >
                <span className="text-white/80">Search components...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-white/30 bg-white/20 px-1.5 font-mono text-[10px] font-medium text-white/80">
                  ⌘K
                </kbd>
              </Button>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-white hover:bg-white/10">
                    <Bell className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Notifications</TooltipContent>
              </Tooltip>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 h-10 px-2 sm:px-3 text-white hover:bg-white/10">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="https://i.pravatar.cc/64" alt="User" />
                      <AvatarFallback>UM</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline">Uriel</span>
                    <ChevronDown className="h-4 w-4 hidden sm:block" />
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
        </header>

        {/* Main content with responsive layout */}
        <main className="container px-4 py-4 sm:py-6 lg:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* Left column - Forms and inputs */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Forms Section */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <CardTitle>Form Components</CardTitle>
                  <CardDescription>Input fields, validation states, and form controls</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email"
                        className="h-11"
                      />
                      <p className="text-sm text-muted-foreground">We'll never share your email.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email-error">Email (Error State)</Label>
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="terms" className="h-5 w-5" />
                          <Label htmlFor="terms" className="text-sm font-normal">I agree to the terms</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="marketing" defaultChecked className="h-5 w-5" />
                          <Label htmlFor="marketing" className="text-sm font-normal">Send me marketing emails</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="disabled" disabled className="h-5 w-5" />
                          <Label htmlFor="disabled" className="text-sm font-normal">Disabled option</Label>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <RadioGroup defaultValue="medium">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="low" id="r1" className="h-5 w-5" />
                            <Label htmlFor="r1" className="text-sm font-normal">Low priority</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="medium" id="r2" className="h-5 w-5" />
                            <Label htmlFor="r2" className="text-sm font-normal">Medium priority</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="high" id="r3" className="h-5 w-5" />
                            <Label htmlFor="r3" className="text-sm font-normal">High priority</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="notifications" className="text-sm font-medium">Email notifications</Label>
                        <div className="text-sm text-muted-foreground">Receive email updates about your account</div>
                      </div>
                      <Switch id="notifications" />
                    </div>

                    <div className="space-y-2">
                      <Label>Range Slider</Label>
                      <Slider defaultValue={[33]} max={100} step={1} className="w-full" />
                      <div className="text-sm text-muted-foreground">Value: 33</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Button States and Actions */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <CardTitle>Button States</CardTitle>
                  <CardDescription>All button variants, states, and interactive elements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
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

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">States</h4>
                    <div className="flex flex-wrap gap-2">
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
                          "Load Data"
                        )}
                      </Button>
                      <Button variant="outline" size="icon" className="h-11 w-11 min-w-[44px]">
                        <Plus className="h-4 w-4" />
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
                        className="h-11"
                        size="sm"
                      >
                        +10
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setProgress(p => Math.max(0, p - 10))}
                        className="h-11"
                        size="sm"
                      >
                        -10
                      </Button>
                      <Button 
                        variant="ghost" 
                        onClick={() => setProgress(0)}
                        className="h-11"
                        size="sm"
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Feedback and overlays */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* Feedback Components */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <CardTitle>Feedback</CardTitle>
                  <CardDescription>Alerts and status messages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Info</AlertTitle>
                    <AlertDescription>
                      This is an informational alert message.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Warning</AlertTitle>
                    <AlertDescription>
                      This action cannot be undone.
                    </AlertDescription>
                  </Alert>
                  
                  <Alert variant="destructive">
                    <CircleX className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      Your session has expired. Please log in again.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>
                      Your changes have been saved successfully.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Date Picker */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <CardTitle>Date Selection</CardTitle>
                  <CardDescription>Calendar and date picker components</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
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
                  </div>
                </CardContent>
              </Card>

              {/* Overlay Components */}
              <Card>
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
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
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <CardTitle>Avatar & Identity</CardTitle>
                  <CardDescription>User avatars, badges, and identity components</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
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
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <CardTitle>Loading States</CardTitle>
                  <CardDescription>Skeleton placeholders and loading indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
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