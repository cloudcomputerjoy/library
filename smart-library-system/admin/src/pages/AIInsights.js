import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Alert,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useAdmin } from '../context/AdminContext';
import * as openrouterApi from '../services/openrouterApi';
import { TrendingUp, BookOpen, Users, BarChart3 } from 'lucide-react';
import { PageSkeleton, CardSkeleton, FormFieldSkeleton, ListItemSkeleton, Grid as SkeletonGrid } from '../components/SkeletonLoader';

const AIInsights = () => {
  const { apiCall } = useAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [trends, setTrends] = useState(null);
  const [readingPatterns, setReadingPatterns] = useState(null);
  const [queryInput, setQueryInput] = useState('');
  const [queryResults, setQueryResults] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Fetch library statistics for AI analysis
  const fetchLibraryStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch current library stats
      const statsResponse = await apiCall('get', '/admin/dashboard/stats');
      const stats = statsResponse?.data || {
        totalStudents: 0,
        totalBooks: 0,
        issuedToday: 0,
        overdueBooks: 0,
        peakHours: '10 AM - 2 PM',
        popularCategories: ['Fiction', 'Science', 'History'],
        avgBorrowDays: 14,
        returnRate: 95
      };

      // 1. Generate Library Insights
      const insightsData = await openrouterApi.generateLibraryInsights(stats);
      setInsights(insightsData);

      // 2. Get Recommendations (fetch top books for recommendations)
      const booksResponse = await apiCall('get', '/admin/books?limit=20');
      const books = booksResponse?.data?.books || [];
      const studentProfile = {
        readingLevel: 'Intermediate',
        previousBooks: ['The Great Gatsby', 'Educated', 'Thinking, Fast and Slow'],
        preferences: ['Fiction', 'Self-help', 'Science'],
        academicFocus: 'Liberal Arts'
      };
      
      const recommendationsData = await openrouterApi.getBookRecommendations(studentProfile, books);
      setRecommendations(recommendationsData);

      // 3. Predict Trends (fetch historical data)
      const historicalData = await generateHistoricalData();
      const trendsData = await openrouterApi.predictLibraryTrends(historicalData);
      setTrends(trendsData);

      // 4. Analyze Reading Patterns
      const studentData = {
        totalStudents: stats.totalStudents,
        avgBooksPerStudent: 2.5,
        frequencyDistribution: { heavy: 20, moderate: 50, light: 30 },
        popularGenres: stats.popularCategories,
        avgReadingLevel: 'Intermediate',
        engagementRate: 85
      };
      
      const patternsData = await openrouterApi.analyzeReadingPatterns(studentData);
      setReadingPatterns(patternsData);

    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to generate AI insights. Please check your OpenRouter API key.');
    } finally {
      setLoading(false);
    }
  };

  // Generate mock historical data for trend prediction
  const generateHistoricalData = async () => {
    try {
      const response = await apiCall('get', '/admin/reports/historical');
      if (response?.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('Could not fetch historical data:', err);
    }

    // Return mock data if fetch fails
    return Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      issues: 200 + Math.random() * 100,
      returns: 180 + Math.random() * 100,
      newStudents: 30 + Math.random() * 20,
      topCategory: ['Fiction', 'Science', 'History', 'Technology'][Math.floor(Math.random() * 4)],
      totalBooks: 5000,
      categories: ['Fiction', 'Science', 'History', 'Technology', 'Art']
    }));
  };

  // Handle natural language query
  const handleQuery = async () => {
    if (!queryInput.trim()) return;

    try {
      setQueryLoading(true);
      const response = await openrouterApi.queryAI(queryInput, {
        libraryName: 'Smart Library',
        totalUsers: 1000,
        totalBooks: 5000
      });
      setQueryResults(response);
    } catch (err) {
      setError('Failed to process query');
    } finally {
      setQueryLoading(false);
    }
  };

  // Generate management report
  const handleGenerateReport = async () => {
    try {
      setLoading(true);
      const reportData = {
        period: 'Q1 2024',
        totalIssues: 2500,
        totalReturns: 2400,
        overdueRate: 5,
        newRegistrations: 150,
        activeUsers: 800,
        revenue: 50000,
        topCategories: ['Fiction', 'Science', 'Self-help'],
        underCategories: ['Poetry', 'Philosophy'],
        staffEfficiency: 92,
        uptime: 99.8
      };

      await openrouterApi.generateManagementReport(reportData);
      setReportDialogOpen(false);
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const StatCard = ({ icon: Icon, title, value, description }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Icon size={32} style={{ color: '#1976d2' }} />
          <Box>
            <Typography variant="overline" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        🤖 AI-Powered Library Insights
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* OpenRouter API Configuration Notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        ⚙️ <strong>Setup Required:</strong> Add your OpenRouter API key to <code>.env</code> as{' '}
        <code>REACT_APP_OPENROUTER_API_KEY</code> to enable AI features.{' '}
        <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer">
          Get your API key here
        </a>
      </Alert>

      {loading ? (
        <PageSkeleton fullHeight={false}>
          <SkeletonGrid container spacing={2} sx={{ mb: 4 }}>
            <SkeletonGrid item xs={12} sm={6} md={3}>
              <CardSkeleton />
            </SkeletonGrid>
            <SkeletonGrid item xs={12} sm={6} md={3}>
              <CardSkeleton />
            </SkeletonGrid>
            <SkeletonGrid item xs={12} sm={6} md={3}>
              <CardSkeleton />
            </SkeletonGrid>
            <SkeletonGrid item xs={12} sm={6} md={3}>
              <CardSkeleton />
            </SkeletonGrid>
          </SkeletonGrid>

          {/* Query Interface */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <FormFieldSkeleton count={2} />
            </CardContent>
          </Card>

          {/* Insights Section */}
          <Card sx={{ mb: 3 }}>
            <CardSkeleton />
          </Card>

          {/* Recommendations Section */}
          <Card sx={{ mb: 3 }}>
            <CardSkeleton />
          </Card>

          {/* Trends Section */}
          <Card sx={{ mb: 3 }}>
            <CardSkeleton />
          </Card>

          {/* Reading Patterns Section */}
          <Card sx={{ mb: 3 }}>
            <CardSkeleton />
          </Card>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={fetchLibraryStats}
              disabled={loading}
            >
              🔄 Refresh Insights
            </Button>
            <Button
              variant="outlined"
              onClick={() => setReportDialogOpen(true)}
            >
              📋 Generate Report
            </Button>
          </Box>
        </PageSkeleton>
      ) : (
        <>
          {/* Quick Stats */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={TrendingUp}
                title="Peak Hours"
                value="10 AM - 2 PM"
                description="Highest library activity"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={BookOpen}
                title="Popular Category"
                value="Fiction"
                description="Most borrowed category"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={Users}
                title="Engagement"
                value="85%"
                description="Active student engagement"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                icon={BarChart3}
                title="Growth Rate"
                value="+12%"
                description="Monthly compared to last month"
              />
            </Grid>
          </Grid>

          {/* Query Interface */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Ask AI About Your Library
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="E.g., 'What books should we buy for students interested in science?'"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuery()}
                  disabled={queryLoading}
                />
                <Button
                  variant="contained"
                  onClick={handleQuery}
                  disabled={queryLoading || !queryInput.trim()}
                >
                  Ask AI
                </Button>
              </Box>
              {queryResults && (
                <Paper sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="body2">{queryResults}</Typography>
                </Paper>
              )}
            </CardContent>
          </Card>

          {/* Insights Section */}
          {insights && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📊 Library Insights
                </Typography>
                {Array.isArray(insights.insights) ? (
                  <Box component="ul">
                    {insights.insights.map((insight, idx) => (
                      <li key={idx}>
                        <Typography variant="body2">{insight}</Typography>
                      </li>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2">{JSON.stringify(insights.insights)}</Typography>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recommendations Section */}
          {recommendations?.topRecommendations && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📚 Top Recommendations
                </Typography>
                <Grid container spacing={2}>
                  {(Array.isArray(recommendations.topRecommendations)
                    ? recommendations.topRecommendations
                    : [recommendations.topRecommendations]
                  ).map((rec, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {rec.title || `Recommendation ${idx + 1}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rec.reason || rec.description || JSON.stringify(rec)}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Trends Section */}
          {trends?.seasonalTrends && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  📈 Predicted Trends
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(trends, null, 2)}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Reading Patterns Section */}
          {readingPatterns?.readingSegments && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  👥 Reading Patterns Analysis
                </Typography>
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(readingPatterns, null, 2)}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={fetchLibraryStats}
              disabled={loading}
            >
              🔄 Refresh Insights
            </Button>
            <Button
              variant="outlined"
              onClick={() => setReportDialogOpen(true)}
            >
              📋 Generate Report
            </Button>
          </Box>

          {/* Report Generation Dialog */}
          <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)}>
            <DialogTitle>Generate Management Report</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mt: 2 }}>
                Generate a comprehensive AI-powered management report for your library.
                This will analyze current metrics and provide strategic recommendations.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReportDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerateReport} variant="contained">
                Generate
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default AIInsights;
